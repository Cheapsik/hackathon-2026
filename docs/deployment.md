# Production deployment over SSH

The production workflow builds the backend and frontend images in GitHub Actions, exports them with `docker save`, and transfers the compressed bundle directly to the server over SSH. Application images are never pushed to or pulled from Docker Hub or another registry.

The PostgreSQL/pgvector image remains a public third-party dependency and is pulled by the server when it is not already present. This setup avoids an application image registry; it does not provide an air-gapped installation.

## Server prerequisites

- A Linux server with Docker Engine and a current Docker Compose v2 release supporting `--wait` and `--wait-timeout`.
- An unprivileged deployment user with access to the Docker daemon.
- A writable deployment directory (by default `/opt/castor`).
- TCP port 8080 available, or a different `HTTP_PORT` configured in `.env`.

## Provision with CloudFormation

[`../infra/cloudformation.yml`](../infra/cloudformation.yml) creates a dedicated VPC, public subnet, EC2 security group, Ubuntu 24.04 LTS instance, imported EC2 key pair, and an Elastic IP. The instance bootstrap installs Docker with Compose v2 and creates the `castor` deployment user and `/opt/castor/.env`.

The template imports the repository's configured RSA public key as `${AWS::StackName}-deployment`. CloudFormation never receives or returns the matching private key. Make sure that private key is available locally and in the GitHub `DEPLOY_SSH_KEY` secret.

Determine the trusted public IPv4 CIDR that should be allowed to use SSH, and deploy the stack:

```bash
aws cloudformation deploy \
  --stack-name castor-production \
  --template-file infra/cloudformation.yml \
  --parameter-overrides \
    SshAllowedCidr=203.0.113.10/32
```

Replace the example CIDR. Do not use `0.0.0.0/0` for `SshAllowedCidr`. After the stack reaches `CREATE_COMPLETE`, get its outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name castor-production \
  --query 'Stacks[0].Outputs' \
  --output table
```

Use the `PublicIp` output as `DEPLOY_HOST`, `castor` as `DEPLOY_USER`, and the private key matching `DeploymentKeyFingerprint` as `DEPLOY_SSH_KEY`. Before the first deployment, connect over SSH, wait for `sudo cloud-init status --wait`, and populate `/opt/castor/.env`.

The `ApplicationPort` parameter must match `HTTP_PORT` in the server `.env`. The Elastic IP remains allocated until the stack is deleted. The application port is public by default; set `ApplicationAllowedCidr` when access should be restricted. For internet-facing production traffic, terminate TLS in a reverse proxy and restrict the exposed application port appropriately.

Docker images and PostgreSQL data live on the encrypted root EBS volume. The template sets `DeleteOnTermination: false` so an EC2 replacement or stack deletion leaves that volume available for recovery. The retained, unattached volume continues to incur charges; back it up and either reattach it during recovery or delete it explicitly when its data is no longer needed.

Prepare the deployment directory once:

```bash
sudo install -d -o castor -g castor -m 0750 /opt/castor
sudo -u castor install -m 0600 /dev/null /opt/castor/.env
sudo -u castor editor /opt/castor/.env
```

The manual commands are unnecessary when the CloudFormation template provisioned the host. Otherwise, replace `castor` with the deployment user. Populate `.env` from [`.env.example`](../.env.example), using a strong, unique `POSTGRES_PASSWORD`. Keep this file only on the server. The deployment does not overwrite it.

## GitHub production environment

Create a GitHub environment named `production`. Protect it with required reviewers if deployments need approval, then configure:

| Name | Type | Purpose |
| --- | --- | --- |
| `DEPLOY_HOST` | Secret | Server hostname or IP address. |
| `DEPLOY_USER` | Secret | Unprivileged SSH deployment user. |
| `DEPLOY_SSH_KEY` | Secret | Private SSH key dedicated to deployment. |
| `DEPLOY_KNOWN_HOSTS` | Secret | Pinned server host-key line in OpenSSH `known_hosts` format. Obtain it through a trusted channel and verify its fingerprint. |
| `DEPLOY_PORT` | Variable | SSH port; defaults to `22`. |
| `DEPLOY_PATH` | Variable | Absolute server directory; defaults to `/opt/castor`. Only letters, digits, `_`, `.`, `/`, and `-` are accepted. |

The public half of `DEPLOY_SSH_KEY` must be in the deployment user's `authorized_keys`. Restrict that user and key at the server level according to the host's security policy.

## Deploy and rollback behavior

Every push to `main` deploys automatically. The same workflow can be started manually from the Actions tab. Deployments are serialized so two releases cannot modify the server concurrently.

The remote script:

1. validates the server `.env` and Compose configuration;
2. loads the two application images from the SSH bundle;
3. waits for PostgreSQL and the frontend health checks;
4. verifies that the database, backend, and frontend containers remain running;
5. rolls back to the previous image tag and Compose file if activation fails;
6. keeps the current and previous image versions for recovery.

Database migrations run automatically when the backend starts. An application rollback cannot undo a database migration, so migrations must remain backward compatible with the preceding release.

After a successful deployment, the application is available on `http://SERVER:8080` by default. Put a TLS-terminating reverse proxy in front of this port for public production traffic, or bind the application to loopback with `HTTP_BIND_ADDRESS=127.0.0.1` when the proxy runs on the same server.
