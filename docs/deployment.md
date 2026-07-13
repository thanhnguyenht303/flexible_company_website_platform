# Deployment

## Docker Compose Services

- `postgres`: PostgreSQL 16 with a named Docker volume.
- `app`: Next.js production server built from `Dockerfile`.
- `nginx`: Reverse proxy for HTTP, HTTPS termination, and certificate challenge paths.

The app container mounts:

```text
../Images        -> /app/Images
../files_storage -> /app/files_storage
./public/uploads -> /app/public/uploads
```

`../Images` and `../files_storage` are runtime data and must survive rebuilds.

## Production Environment Checklist

Before starting the full stack, set these in `.env`:

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
APP_SECRET=<unique 64-character secret>
DATABASE_NAME=company_website
DATABASE_USER=company_user
DATABASE_PASSWORD=<strong database password>
DATABASE_URL=postgresql://company_user:<strong database password>@postgres:5432/company_website?schema=public
ALLOW_ADMIN_BOOTSTRAP=true
SESSION_COOKIE_NAME=__Host-cw_session
SESSION_EXPIRES_HOURS=24
MAX_UPLOAD_MB=10
MAX_FILE_UPLOAD_MB=10
MAIL_DRIVER=smtp
SMTP_HOST=<smtp host>
SMTP_PORT=587
SMTP_USER=<smtp user>
SMTP_PASSWORD=<smtp password>
SMTP_FROM=no-reply@your-domain.com
```

Use the `postgres` host in `DATABASE_URL` when the app runs inside Docker Compose. Use `localhost` only for host-machine tools talking to the forwarded database port.

## Server Flow

```bash
cp .env.example .env
docker compose up -d postgres
docker compose build app
docker compose run --rm app pnpm prisma:migrate:deploy
docker compose run --rm app pnpm db:seed
docker compose run --rm app pnpm setup:admin
docker compose up -d app nginx
```

After the Super Admin is created, set `ALLOW_ADMIN_BOOTSTRAP=false` and restart the app:

```bash
docker compose up -d app
```

## Domain and HTTPS

1. Create DNS `A` / `AAAA` records pointing the domain to the server.
2. Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com`.
3. Replace `your-domain.com` and `www.your-domain.com` in `docker/nginx.conf`.
4. Keep `client_max_body_size` higher than `MAX_UPLOAD_MB` and `MAX_FILE_UPLOAD_MB`; the default Nginx file sets `12m`.
5. Start Nginx and enable HTTPS with Certbot or your certificate manager.
6. Verify `/`, `/admin/login`, `/api/media/<id>`, and a public form submission.
7. Verify Email Center SMTP tests if the deployment will send workflow mail.

## Data That Must Be Backed Up

Back up all of the following together:

- PostgreSQL database.
- `../Images` public image library.
- `../files_storage` private file library.
- Any legacy files under `public/uploads`, if used.

The provided command:

```bash
pnpm backup:db
```

creates a database dump under `backups/` and archives `public/uploads`. It does not currently archive the sibling `../Images` or `../files_storage` folders, so copy or snapshot those folders separately.

Example server copy:

```bash
mkdir -p backups/runtime_$(date +"%Y%m%d_%H%M%S")
cp -a ../Images backups/runtime_$(date +"%Y%m%d_%H%M%S")/
cp -a ../files_storage backups/runtime_$(date +"%Y%m%d_%H%M%S")/
```

Restore a database dump with:

```bash
pnpm restore:db backups/db_YYYYMMDD_HHMMSS.sql
```

## Post-Deploy Checks

- Public pages render and hidden pages return `404`.
- Admin login works and the session expires according to `SESSION_EXPIRES_HOURS`.
- Site logo, theme background, post images, product/service galleries, team photos, footer logos, and page-builder images render through `/api/media/:id`.
- Public contact, service review, job application, and custom form submissions respect validation and rate limits.
- `/qa` loads published Q&A items and the seeded `ask-a-question` form after `pnpm db:seed`.
- `/admin/email/settings` SMTP test succeeds when mail sending is required.
- Email templates save only registered or custom variables with exact `{{variableName}}` syntax.
- Admin-only private file downloads require a user with `careers.manage`, `forms.manage`, or `leads.manage`.
- `ALLOW_ADMIN_BOOTSTRAP=false` after bootstrap.
