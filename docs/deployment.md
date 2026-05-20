# Deployment

## Docker Compose Services

- `postgres`: PostgreSQL 16 with a named volume.
- `app`: Next.js app running as a Node server.
- `nginx`: Reverse proxy for HTTP and future HTTPS certificate challenges.

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

## Domain

1. Create a DNS A record pointing the domain to the server public IP.
2. Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com`.
3. Replace `your-domain.com` in `docker/nginx.conf`.
4. Start Nginx and enable HTTPS with Certbot or your certificate manager.
5. Verify `/` and `/admin/login`.

## Backups

```bash
pnpm backup:db
```

Backups are written to `backups/`, which is ignored by git.
