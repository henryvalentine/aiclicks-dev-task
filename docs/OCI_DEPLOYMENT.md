# OCI deployment: `aiclicks.terrainica.com`

This guide adds AIClicks to the OCI VM that already serves `terrainica.com`. It assumes Nginx is already running and deliberately uses a separate app directory, systemd services, data directory and Nginx server block. The exercise application uses the supplied SQLite seed data, not PostgreSQL.

## Deployment shape

- Browser: `https://aiclicks.terrainica.com`
- Nginx: public entry point on ports 80/443
- Next.js: `127.0.0.1:3340`, managed by systemd (port 3000 is already used by Terrainica)
- FastAPI: `127.0.0.1:8800`, managed by systemd
- SQLite file: `/var/lib/aiclicks/mentions.db` on persistent VM storage, outside the Git checkout

Nginx proxies `/mentions`, `/mentions/trends` and `/health` to FastAPI; all other paths go to Next.js. SQLite does not need a network port. No database service or public database ingress rule is required for this app.

## 1. Check the VM before changing anything

SSH into the server and inspect the current services and runtime versions:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
node --version
npm --version
python3 --version
```

Do not replace the existing Nginx configuration. Back up any Nginx files before editing them:

```bash
sudo cp -a /etc/nginx /etc/nginx.backup-aiclicks-$(date +%Y%m%d-%H%M%S)
```

Install Python venv/pip and Node.js 20+ if needed, using packages appropriate for your OS. The requirements pin a current FastAPI/Pydantic v2 combination for Python 3.14; install into a clean virtual environment after changing pinned package versions.

## 2. Create the service account and persistent data directory

If an account named `aiclicks` does not already exist:

```bash
sudo useradd --system --home /opt/aiclicks --shell /usr/sbin/nologin aiclicks
```

Create a data directory that is separate from the source checkout. Confirm that `/var/lib` is backed by persistent VM storage and not an ephemeral/container filesystem:

```bash
sudo install -d -o aiclicks -g aiclicks -m 750 /var/lib/aiclicks
sudo mkdir -p /opt/aiclicks
sudo chown "$USER":"$USER" /opt/aiclicks
```

This separation means pulling or replacing application code does not replace the SQLite file. It does not replace a backup strategy: arrange regular backups of `/var/lib/aiclicks/mentions.db` and periodically test restoring them.

## 3. Clone the repository

```bash
cd /opt/aiclicks
git clone https://github.com/YOUR_GITHUB_USERNAME/aiclicks-dev-task.git app
sudo chown -R aiclicks:aiclicks /opt/aiclicks/app
```

Replace the example URL with your real public repository. For updates, inspect the target commit before pulling/restarting. Do not commit the generated database file or any environment files.

## 4. Install the backend and initialize SQLite once

```bash
sudo -u aiclicks python3 -m venv /opt/aiclicks/app/backend/.venv
sudo -u aiclicks /opt/aiclicks/app/backend/.venv/bin/pip install \
  -r /opt/aiclicks/app/backend/requirements.txt
```

Create the API environment file:

```bash
sudo install -m 640 -o root -g aiclicks /dev/null /etc/aiclicks-api.env
sudo nano /etc/aiclicks-api.env
```

Add:

```dotenv
MENTIONS_DB_PATH=/var/lib/aiclicks/mentions.db
FRONTEND_ORIGINS=https://aiclicks.terrainica.com
```

Seed the database from the provided root-level `seed_data.sql` as the service account. Run this only for the initial setup or when you intentionally want to reset the sample data:

```bash
sudo -u aiclicks env MENTIONS_DB_PATH=/var/lib/aiclicks/mentions.db \
  /opt/aiclicks/app/backend/.venv/bin/python /opt/aiclicks/app/backend/seed_db.py
```

The command intentionally deletes and recreates the database file. **Do not run it as part of routine deployments or restarts**, or you will reset the dataset. Confirm the output reports 10,000 records.

## 5. Run FastAPI with systemd

The example unit is in `deploy/aiclicks-api.service.example`. Copy it to `/etc/systemd/system/aiclicks-api.service` after checking paths and the service account. The unit should include:

```ini
[Unit]
Description=AIClicks FastAPI service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=aiclicks
Group=aiclicks
WorkingDirectory=/opt/aiclicks/app/backend
EnvironmentFile=/etc/aiclicks-api.env
ExecStart=/opt/aiclicks/app/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8800
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Then enable and test:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aiclicks-api
sudo systemctl status aiclicks-api --no-pager
curl -fsS http://127.0.0.1:8800/health
```

Expected response: `{"status":"ok","database":"available"}`. Logs: `sudo journalctl -u aiclicks-api -n 100 --no-pager`.

## 6. Build and run Next.js

Build using the public same-origin API URL because Nginx will proxy API calls on the same hostname:

```bash
cd /opt/aiclicks/app/frontend
sudo install -d -o aiclicks -g aiclicks -m 0750 /opt/aiclicks/.npm
sudo chown -R aiclicks:aiclicks /opt/aiclicks/.npm
sudo -u aiclicks -H npm cache verify --cache /opt/aiclicks/.npm
sudo -u aiclicks -H npm ci --cache /opt/aiclicks/.npm
sudo -u aiclicks -H npm run typecheck
sudo -u aiclicks -H env NEXT_PUBLIC_API_URL=https://aiclicks.terrainica.com npm run build
```

Run npm as the `aiclicks` account, not as root. If npm reports a cache permission error, inspect `sudo -u aiclicks -H npm config get cache`, correct that directory's ownership, remove only an incomplete `node_modules` directory, and retry `npm ci`. Do not delete `package-lock.json` to work around an installation error.

Copy `deploy/aiclicks-web.service.example` to `/etc/systemd/system/aiclicks-web.service`. Ensure the unit's working directory and `npm` path match your VM. It should run `npm run start -- --hostname 127.0.0.1 --port 3340` as the `aiclicks` user, with `NODE_ENV=production` and `PORT=3340` set.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aiclicks-web
sudo systemctl status aiclicks-web --no-pager
curl -I http://127.0.0.1:3340
```

## 7. Add DNS for the subdomain

In the DNS zone that manages `terrainica.com`, add an `A` record:

- Type: `A`
- Name/host: `aiclicks`
- Value: the same public IPv4 address used by your OCI VM
- TTL: your usual/default value

Verify DNS from your workstation:

```bash
dig +short aiclicks.terrainica.com A
```

In OCI and the OS firewall, allow inbound TCP 80 and 443 only as needed. Do not expose ports 3340 or 8800 directly to the internet. The existing Terrainica frontend on port 3000 must remain untouched.

## 8. Configure Nginx in a separate server block

Use a separate server block for `aiclicks.terrainica.com`; never overwrite the existing Terrainica server block. On the already-deployed VM, the active AIClicks file is `/etc/nginx/sites-available/aiclicks`, enabled by `/etc/nginx/sites-enabled/aiclicks`; inspect and update that file rather than creating a second block for the same hostname. For a fresh VM only, create a new file in `sites-available` (or `conf.d` on distributions using that layout) and enable it using the distribution's normal mechanism.

Use this HTTP configuration first, then add HTTPS with your existing Certbot/certificate workflow:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name aiclicks.terrainica.com;

    location = /health {
        proxy_pass http://127.0.0.1:8800/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /mentions {
        proxy_pass http://127.0.0.1:8800/mentions;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /mentions/trends {
        proxy_pass http://127.0.0.1:8800/mentions/trends;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3340;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Then validate/reload Nginx and obtain the certificate using your existing approach:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Smoke-test the live application

```bash
curl -fsS https://aiclicks.terrainica.com/health
curl -fsS -X POST https://aiclicks.terrainica.com/mentions \
  -H 'Content-Type: application/json' \
  -d '{"page":1,"per_page":5}'
curl -fsS -X POST https://aiclicks.terrainica.com/mentions/trends \
  -H 'Content-Type: application/json' \
  -d '{"date_from":"2025-01-01","date_to":"2025-01-07","group_by":"day"}'
```

Also open the dashboard in a private browser session and verify filtering, pagination and both chart groupings.

## Persistence note

A SQLite database file survives ordinary service restarts and VM reboots when it is stored on a persistent disk. It can still be lost through disk failure, accidental deletion, an ephemeral deployment filesystem or an untested migration. The application therefore keeps its DB outside the code checkout and should have a backup/restore routine. PostgreSQL with persistent storage and automated backups is a reasonable future improvement for a long-lived production service, but SQLite is intentionally used here to meet the task specification.
