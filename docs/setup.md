# Setup

## Requirements

- Node.js 20.
- pnpm through Corepack.
- Docker Desktop or Docker Engine.
- PostgreSQL through Docker Compose for local development.

Enable pnpm if needed:

```bash
corepack enable
```

## Fresh Clone

Run from the app folder:

```bash
cd flexible_company_website_platform
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm prisma:migrate:dev
pnpm db:seed
pnpm setup:admin
pnpm dev
```

Open:

- Public site: http://localhost:3000
- Admin login: http://localhost:3000/admin/login
- Prisma Studio: `pnpm prisma:studio`

## Interactive Environment Setup

```bash
pnpm setup
```

The setup script:

- Creates or updates `.env`.
- Generates a random 64-character hex `APP_SECRET`.
- Writes database host/name/user/password fields.
- Builds `DATABASE_URL`.
- Sets `ALLOW_ADMIN_BOOTSTRAP=true` so the first admin can be created.

It does not ask for or store an admin password. Create the first admin with `pnpm setup:admin` after migrations are applied.

## Environment Notes

Required for normal local development:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
APP_SECRET=development-secret-change-this-32chars
DATABASE_URL=postgresql://company_user:replace_with_a_strong_database_password@localhost:5432/company_website?schema=public
ALLOW_ADMIN_BOOTSTRAP=true
IMAGE_STORAGE_ROOT=../Images
FILE_STORAGE_ROOT=../files_storage
MAX_UPLOAD_MB=10
MAX_FILE_UPLOAD_MB=10
SESSION_EXPIRES_HOURS=24
RATE_LIMIT_LOGIN_PER_MINUTE=5
```

Important production differences:

- `APP_SECRET` must be unique, at least 32 characters, and not one of the example values.
- `NEXT_PUBLIC_SITE_URL` must use `https://` unless you are serving localhost.
- `ALLOW_ADMIN_BOOTSTRAP` should be `false` after the first Super Admin is created.
- Real `.env` files are ignored by git and must not be committed.

## Runtime Storage Folders

Create the sibling storage folders before using upload-heavy features:

```powershell
New-Item -ItemType Directory -Force `
  ..\Images\posts, `
  ..\Images\products, `
  ..\Images\services, `
  ..\Images\team, `
  ..\Images\logos, `
  ..\Images\theme-backgrounds, `
  ..\Images\page-builder, `
  ..\Images\general, `
  ..\files_storage\job-applications, `
  ..\files_storage\form-submissions, `
  ..\files_storage\general
```

The app creates entity-specific subfolders as uploads arrive, but creating the top-level folders makes local storage paths obvious.

## First Admin

```bash
pnpm setup:admin
```

The script:

- Requires `ALLOW_ADMIN_BOOTSTRAP=true`.
- Creates or updates the `Super Admin` role with `{ all: true }` permissions.
- Refuses to create an extra Super Admin unless confirmed.
- Enforces `PASSWORD_MIN_LENGTH` plus uppercase, lowercase, and numeric characters.
- Hashes the password with bcrypt.

After the first admin is created, set:

```env
ALLOW_ADMIN_BOOTSTRAP=false
```

## Verification

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Use `pnpm test` for fast validation helper coverage. Use `pnpm typecheck` and `pnpm build` before deployment or larger changes.

`pnpm db:seed` also creates the default published `ask-a-question` form used by `/qa` and grants the Editor role forms, leads, and Q&A permissions.

## Common Issues

- Database connection errors usually mean `docker compose up -d postgres` has not finished or `DATABASE_URL` does not match `.env`.
- `APP_SECRET` validation errors in production mean the example secret is still present.
- Upload failures often point to missing `../Images` or `../files_storage` folders, unsupported MIME types, or files larger than `MAX_UPLOAD_MB` / `MAX_FILE_UPLOAD_MB`.
- Admin bootstrap failures are expected when `ALLOW_ADMIN_BOOTSTRAP=false`.
