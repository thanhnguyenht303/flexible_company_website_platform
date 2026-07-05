# Flexible Company Website Platform

A reusable company website CMS built with Next.js App Router, TypeScript, Prisma, PostgreSQL, and Docker Compose. It includes public marketing pages, bilingual content fields, an authenticated admin area, content modules, visual homepage editing, custom forms, lead workflows, Q&A publishing, media/file storage, inquiries, and deployment scripts.

## Feature Overview

- Public pages for home, about, services, products, team, careers, blog, Q&A, contact, custom forms, and privacy.
- English/Vietnamese UI switching with localized content fields for products, services, posts, and team members.
- Admin dashboard for site settings, theme settings, page visibility, visual page builder, services, products, posts, careers, forms, leads, Q&A, team, footer partners, media, inquiries, and users.
- Visual homepage builder with draft/publish workflow, uploaded builder images, layout/style controls, and dynamic team/services/blog/form/Q&A blocks.
- Products, services, and blog posts with draft/published/archived status, optional Vietnamese content, slug generation, SEO fields, and image support.
- Product and service galleries stored in an external image library and served through `/api/media/:id`.
- Team profiles with ordering, visibility controls, photos, and localized role/bio fields.
- Careers module with public job listings, public job application forms, resume uploads, admin job management, and admin-only resume downloads.
- Footer collaborator/partner logos with ordering, visibility, optional links, and normalized logo uploads.
- Contact inquiries and job application inquiries with admin status/internal-note management.
- Custom form builder with field definitions, public form rendering, server-side validation, honeypot/rate limiting, file uploads, admin submissions, and automatic lead creation.
- Lead workflow views for qualifying form submissions, setting priority/status, follow-up dates, notes, and CSV exports.
- Public Q&A pages with admin moderation/publishing and an "Ask a Question" form seeded by default.
- Public service reviews with required name/email, rating, and comment. Submitted reviews are hidden by default for moderation; emails are stored but not displayed publicly.
- Role/permission model with Super Admin bootstrap, bcrypt password hashing, secure session cookies, rate limits, upload limits, and security headers.
- Docker Compose stack for PostgreSQL, the Next.js app, and Nginx.
- Developer docs, setup scripts, seed data, database backup/restore scripts, and Vitest validation tests.

## Local Setup

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

Open:

- Public website: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

For first admin creation, set `ALLOW_ADMIN_BOOTSTRAP=true` in `.env`, run `pnpm setup:admin`, then set it back to `false` before production use.

## Interactive Setup

```bash
pnpm setup
```

The setup script writes `.env`, generates a new `APP_SECRET`, builds `DATABASE_URL`, and enables temporary admin bootstrap. It does not ask for or store admin passwords. Run migrations and seed data before `pnpm setup:admin`.

## Storage

Runtime uploads are stored outside the app folder by default:

```text
../Images/           Public image library for posts, products, services, team photos, logos, theme backgrounds, and page-builder images
../files_storage/    Private file library for job application resumes, form uploads, and future non-image files
```

Docker Compose maps those folders into the app container as `/app/Images` and `/app/files_storage`. The legacy `public/uploads` folder remains as a local placeholder and is not the primary storage path for current media features.

## Production

```bash
cp .env.example .env
docker compose up -d postgres
docker compose build app
docker compose run --rm app pnpm prisma:migrate:deploy
docker compose run --rm app pnpm db:seed
docker compose run --rm app pnpm setup:admin
docker compose up -d app nginx
```

Set `NEXT_PUBLIC_SITE_URL`, generate a production `APP_SECRET`, update `docker/nginx.conf` with the production domain, and point DNS at the server before enabling HTTPS. Back up the database plus both runtime storage folders: `../Images` and `../files_storage`.

## Project Structure

```text
../Images/           External public image library for uploaded media
../files_storage/    External private file library for resumes and documents
app/                 Next.js App Router public pages, admin pages, and API route handlers
components/          Public, admin, and shared React components
config/              Default site/theme/page/module configuration
lib/                 Auth, database, validation, storage, permissions, SEO, i18n, rate-limit helpers
modules/             Feature-owned validation, services, permissions, types, and module notes
prisma/              Prisma schema, migrations, and seed script
scripts/             Setup, admin bootstrap, database backup, database restore
docker/              Nginx and container support files
docs/                Setup, deployment, API, storage, page-builder, and module development notes
public/uploads/      Legacy/local upload placeholder, ignored by git except .gitkeep
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
pnpm restore:db backups/db_YYYYMMDD_HHMMSS.sql
```

## Documentation

- [Setup](docs/setup.md)
- [Deployment](docs/deployment.md)
- [API](docs/api.md)
- [Image Storage](docs/image-storage.md)
- [File Storage](docs/file-storage.md)
- [Visual Page Builder](docs/page-builder.md)
- [Module Development](docs/module-development.md)
