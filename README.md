# Flexible Company Website Platform

A reusable Next.js, TypeScript, Prisma, PostgreSQL, and Docker Compose platform for company websites. It ships with public pages, admin login, site/theme settings, content module scaffolding, inquiries, setup scripts, seed data, and production deployment files.

## What Is Included

- Public website pages for home, about, services, products, team, blog, and contact.
- Admin dashboard routes for settings, theme, pages, services, products, posts, team, media, inquiries, and users.
- PostgreSQL Prisma schema for roles, users, site settings, theme settings, pages, sections, products, services, posts, team members, media, inquiries, and audit logs.
- First-admin bootstrap script with bcrypt password hashing.
- Docker Compose stack for PostgreSQL, the Next.js app, and Nginx.
- `.env.example`, `.gitignore`, backup/restore scripts, and developer docs.
- External image library rooted at `../Images` locally, with folders for posts, products, services, team, logos, and general assets. Docker maps that folder to `/app/Images`.

## Local Setup

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm prisma:migrate:dev
pnpm db:seed
pnpm setup:admin
pnpm dev
```

Open:

- Public website: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

After creating the first admin, set `ALLOW_ADMIN_BOOTSTRAP=false` in production.

Admin login sessions expire after 24 hours by default through `SESSION_EXPIRES_HOURS=24`.

## Interactive Setup

```bash
pnpm setup
```

The setup script writes `.env`, generates a new `APP_SECRET`, and prepares the database URL. It does not ask for or store admin passwords. Use `pnpm setup:admin` after migrations to create the first admin account.

## Production

```bash
cp .env.example .env
docker compose up -d postgres
docker compose build app
docker compose run --rm app pnpm prisma:migrate:deploy
docker compose run --rm app pnpm setup:admin
docker compose up -d app nginx
```

Set DNS to the server IP, update `NEXT_PUBLIC_SITE_URL`, and update `docker/nginx.conf` with the production domain before enabling HTTPS.

## Project Structure

```text
../Images/           External local image library for uploaded media
app/                 Next.js App Router pages and API route handlers
components/          Public, admin, and shared UI components
config/              Default site, theme, and enabled module config
lib/                 Auth, database, validation, uploads, permissions, SEO helpers
modules/             Feature-owned service, validation, permissions, and docs
prisma/              Schema and seed script
scripts/             Setup, admin bootstrap, backup, restore
docker/              Nginx and container support files
docs/                Setup, deployment, API, and module development notes
public/uploads/      Local upload target, ignored by git except .gitkeep
```

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm prisma:studio
pnpm backup:db
```

## Documentation

- [Setup](docs/setup.md)
- [Deployment](docs/deployment.md)
- [Image Storage](docs/image-storage.md)
- [Module Development](docs/module-development.md)
- [API](docs/api.md)
