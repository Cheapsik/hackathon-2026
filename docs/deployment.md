# Production deployment over SSH

The production workflow builds the backend, frontend, and TLS reverse-proxy images in GitHub Actions, exports them with `docker save`, and transfers the compressed bundle directly to the server over SSH. Each application image is bundled with an immutable commit SHA tag and a branch alias such as `main` or `master`. Application images are never pushed to or pulled from Docker Hub or another registry.

The PostgreSQL/pgvector image remains a public third-party dependency and is pulled by the server when it is not already present. This setup avoids an application image registry; it does not provide an air-gapped installation.

## Server prerequisites

- A Linux server with Docker Engine and a current Docker Compose v2 release supporting `--wait` and `--wait-timeout`.
- An unprivileged deployment user with access to the Docker daemon.
- A writable deployment directory (by default `/opt/castor`) containing the production `.env`.
- A valid TLS certificate and private key at `/opt/castor/certs/fullchain.pem` and `/opt/castor/certs/privkey.pem`.
- TCP ports 80 and 443 available, or matching `HTTP_PORT` and `HTTPS_PORT` values configured in `.env` and the host firewall.

## Provision with CloudFormation

[`../infra/cloudformation.yml`](../infra/cloudformation.yml) creates a dedicated VPC, public subnet, EC2 security group, Ubuntu 24.04 LTS instance, imported EC2 key pair, and an Elastic IP. The instance bootstrap installs Docker with Compose v2 and creates the `castor` deployment user, `/opt/castor/.env`, and `/opt/castor/certs`.

The template imports the repository's configured RSA public key as `${AWS::StackName}-deployment`. CloudFormation never receives or returns the matching private key. Make sure that private key is available locally and in the GitHub `DEPLOY_SSH_KEY` secret as a single-line Base64 value.

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

Use the `PublicIp` output as `DEPLOY_HOST`, `castor` as `DEPLOY_USER`, and the private key matching `DeploymentKeyFingerprint` as `DEPLOY_SSH_KEY`. Encode the complete private-key file on Linux before copying it into the GitHub secret:

```bash
base64 -w 0 ~/.ssh/id_rsa
```

Base64 is transport encoding, not encryption; GitHub Secrets remains the security boundary. During a deployment, the workflow decodes the secret into the runner's temporary `~/.ssh/deploy_key` file with mode `0600`, validates it with `ssh-keygen`, uses it explicitly for SSH and SCP, and removes it in an `always()` cleanup step.

Before the first deployment, connect over SSH, wait for `sudo cloud-init status --wait`, populate `/opt/castor/.env`, and install a certificate issued for the DNS name pointing to the Elastic IP.

The `ApplicationPort` and `HttpsPort` parameters must match `HTTP_PORT` and `HTTPS_PORT` in the server `.env`. The Elastic IP remains allocated until the stack is deleted. Both ports are public by default; set `ApplicationAllowedCidr` when access should be restricted. HTTP redirects permanently to HTTPS.

Docker images and PostgreSQL data live on the encrypted root EBS volume. The template sets `DeleteOnTermination: false` so an EC2 replacement or stack deletion leaves that volume available for recovery. The retained, unattached volume continues to incur charges; back it up and either reattach it during recovery or delete it explicitly when its data is no longer needed.

Prepare the deployment directory once:

```bash
sudo install -d -o castor -g castor -m 0750 /opt/castor
sudo -u castor install -m 0600 /dev/null /opt/castor/.env
sudo install -d -o castor -g castor -m 0750 /opt/castor/certs
sudo install -o castor -g castor -m 0644 /path/to/fullchain.pem /opt/castor/certs/fullchain.pem
sudo install -o castor -g castor -m 0600 /path/to/privkey.pem /opt/castor/certs/privkey.pem
sudo -u castor editor /opt/castor/.env
```

CloudFormation creates the directories and empty `.env`, but it does not issue or install a certificate. Replace `castor` with the deployment user when preparing another host. Populate `.env` from [`.env.example`](../.env.example), using a strong, unique `POSTGRES_PASSWORD`. Keep `.env` and the private key only on the server. The deployment requires these files and does not overwrite them. Certificate renewal must replace both certificate files and reload or restart the `proxy` service.

## Configure OpenAI

The application uses the deterministic `placeholder` provider until OpenAI is explicitly enabled. Set these values only in `/opt/castor/.env`:

```dotenv
Llm__Provider=openai
Llm__Model=YOUR_OPENAI_MODEL
Llm__ApiKey=YOUR_OPENAI_PROJECT_API_KEY
Llm__BaseUrl=https://api.openai.com/v1/
Llm__MaxOutputTokens=4096
Llm__TimeoutSeconds=120
```

Do not add the key to GitHub Actions variables or repository files; the deployment preserves the server-side `.env`. The backend validates all required OpenAI settings during start-up. It sends requests through the Responses API, does not persist responses through the API (`store: false`), retries HTTP 429 and 5xx responses, and logs duration, token counts, and request IDs without prompt or response content.

## Seed and demo content

The backend image carries the committed `data/seed` in `/app/seed`, and the production Compose file imports it on every start (`Seed__Path`, `Seed__OnStartup`). The import only adds content and upserts statistics, so restarts are safe. It loads the challenge areas, all Małopolska municipalities with their indicators, and the innovation library. Innovation genomes are then generated in the background by the configured LLM, so enable OpenAI first; otherwise the library gets placeholder genomes.

Demo accounts and content (`data/seed/demo_content.json`: reports, ideas, grant calls, conversations) are opt-in. Add them only in `/opt/castor/.env`:

```dotenv
Seed__DemoContent=true
Seed__DemoPassword=YOUR_DEMO_PASSWORD
```

The backend refuses to start when demo content is on and the password is missing or too weak. Demo reports are matched when first opened, so open them only after the genome job has finished.

## GitHub production environment

Create a GitHub environment named `production`. Protect it with required reviewers if deployments need approval, then configure:

| Name | Type | Purpose |
| --- | --- | --- |
| `DEPLOY_HOST` | Secret | Server hostname or IP address. |
| `DEPLOY_USER` | Secret | Unprivileged SSH deployment user. |
| `DEPLOY_SSH_KEY` | Secret | Complete, non-interactive private SSH key encoded as single-line Base64. |
| `DEPLOY_KNOWN_HOSTS` | Secret | Pinned server host-key line in OpenSSH `known_hosts` format. Obtain it through a trusted channel and verify its fingerprint. |
| `DEPLOY_PORT` | Variable | SSH port; defaults to `22`. |
| `DEPLOY_PATH` | Variable | Absolute server directory; defaults to `/opt/castor`. Only letters, digits, `_`, `.`, `/`, and `-` are accepted. |

The public half of `DEPLOY_SSH_KEY` must be in the deployment user's `authorized_keys`. Restrict that user and key at the server level according to the host's security policy.

## Deploy and rollback behavior

Every push to `main` deploys automatically. The same workflow can be started manually from the Actions tab. Deployments are serialized so two releases cannot modify the server concurrently.

The remote script:

1. receives the versioned Compose candidate directly in `/opt/castor` and validates it against `/opt/castor/.env`;
2. loads the backend, frontend, and TLS proxy images from the SSH bundle;
3. atomically installs it as `/opt/castor/docker-compose.yml` while keeping the previous Compose file;
4. waits for PostgreSQL, frontend, and proxy health checks;
5. verifies that the database, backend, frontend, and proxy containers remain running;
6. rolls back to the previous image tag and Compose file if activation fails;
7. keeps the current and previous image versions for recovery.

Database migrations run automatically when the backend starts. An application rollback cannot undo a database migration, so migrations must remain backward compatible with the preceding release.

After a successful deployment, `http://SERVER` redirects to `https://SERVER`. Use the DNS name covered by the installed certificate; direct access by IP normally fails certificate validation.
