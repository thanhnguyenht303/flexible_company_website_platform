# Setup

## Requirements

- Node.js 20
- pnpm through Corepack
- Docker Desktop or Docker Engine
- PostgreSQL through Docker Compose for local development

## Fresh Clone

```bash
corepack enable
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm prisma:migrate:dev
pnpm db:seed
pnpm setup:admin
pnpm dev
```

## Environment Notes

- `APP_SECRET` must be at least 32 characters.
- `DATABASE_URL` should point to PostgreSQL.
- `ALLOW_ADMIN_BOOTSTRAP=true` is only for initial admin creation.
- Real `.env` files are ignored and must not be committed.

## First Admin

`pnpm setup:admin` creates a Super Admin role if needed, refuses extra Super Admin accounts unless confirmed, hashes the password with bcrypt, and never writes the password to `.env` or logs.
