# Production deployment over SSH

The production workflow builds the backend and frontend images in GitHub Actions, exports them with `docker save`, and transfers the compressed bundle directly to the server over SSH. Application images are never pushed to or pulled from Docker Hub or another registry.

The PostgreSQL/pgvector image remains a public third-party dependency and is pulled by the server when it is not already present. This setup avoids an application image registry; it does not provide an air-gapped installation.

## Server prerequisites

- A Linux server with Docker Engine and a current Docker Compose v2 release supporting `--wait` and `--wait-timeout`.
- An unprivileged deployment user with access to the Docker daemon.
- A writable deployment directory (by default `/opt/castor`).
- TCP port 8080 available, or a different `HTTP_PORT` configured in `.env`.

Prepare the deployment directory once:

```bash
sudo install -d -o castor -g castor -m 0750 /opt/castor
sudo -u castor install -m 0600 /dev/null /opt/castor/.env
sudo -u castor editor /opt/castor/.env
```

Replace `castor` with the deployment user. Populate `.env` from [`.env.example`](../.env.example), using a strong, unique `POSTGRES_PASSWORD`. Keep this file only on the server. The deployment does not overwrite it.

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
