# Troubleshooting

Use this guide for common local, admin, upload, email, and deployment issues.

## Local Setup

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `pnpm install` fails | Corepack/pnpm not enabled | Run `corepack enable`, then retry. |
| Prisma cannot connect | PostgreSQL container is not ready or `DATABASE_URL` is wrong | Run `docker compose up -d postgres`, wait a few seconds, and verify `.env`. |
| Migrations fail after schema changes | Database is behind or local data conflicts | Review the migration error, then use `pnpm prisma:migrate:dev` locally. Do not reset production data. |
| Seed does not create expected forms/templates | Seed did not run after new migrations | Run `pnpm db:seed` after migrations. |

## Admin Login and Access

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Cannot create first admin | `ALLOW_ADMIN_BOOTSTRAP=false` | Temporarily set it to `true`, run `pnpm setup:admin`, then set it back to `false`. |
| Admin session disappears | Cookie settings or `APP_SECRET` changed | Keep `APP_SECRET` stable and check `NEXT_PUBLIC_SITE_URL`/HTTPS settings. |
| Admin page shows forbidden | Role lacks the required authority | Add the authority in `/admin/roles` with a Super Admin account. |
| API mutation returns forbidden from scripts | Missing same-origin CSRF header | Send an `Origin` or `Referer` matching the request host for unsafe admin methods. |

## Uploads and Storage

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Images do not render | Missing `IMAGE_STORAGE_ROOT` files or media metadata mismatch | Verify the file exists under `../Images` and the `MediaAsset` record points to it. |
| Resume/form file download is forbidden | User lacks related authority | Use an admin with `careers.manage`, `forms.manage`, or `leads.manage`. |
| Upload rejected | Unsupported MIME/signature or file too large | Use JPG/PNG/WEBP for images and PDF/DOC/DOCX for private documents; check `MAX_UPLOAD_MB` and `MAX_FILE_UPLOAD_MB`. |
| Upload works locally but not in Docker | Volume path mismatch | Verify Docker mounts `../Images` to `/app/Images` and `../files_storage` to `/app/files_storage`. |

## Forms, Leads, and Q&A

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Public form 404s | Form is missing, unpublished, or slug changed | Publish the form and confirm the slug at `/admin/forms`. |
| Form submission creates no Q&A item | Form `sourceType` is not `qa` | Set the form source type to `qa` or use the seeded `ask-a-question` form. |
| Q&A item does not appear publicly | Item is not published | Publish the Q&A item and confirm `publishedAt` is set. |
| CSV export is empty | Filters exclude records | Remove `q`, `status`, or `formId` filters and retry. |

## Email Center

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Send fails | SMTP settings missing or invalid | Check `/admin/email/settings`, run SMTP test, and verify environment fallback values. |
| Template refuses to save/send | Unknown variable key | Use exact registered variables such as `{{applicantName}}`; variable keys are case-sensitive. |
| Inbox sync fails | IMAP host/port/auth settings invalid | Run IMAP test and verify provider security settings. |
| Workflow email button missing | Admin lacks `email.manage` | Add `email.manage` to the role or use a Super Admin. |

## Deployment

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Production build cannot connect to DB during migrations | Docker `DATABASE_URL` uses `localhost` | Use `postgres` as the database host inside Compose. |
| HTTPS cookie problems | `NEXT_PUBLIC_SITE_URL` or cookie name mismatch | Use an HTTPS production URL and a stable `SESSION_COOKIE_NAME`. |
| Large uploads fail at proxy | Nginx body limit too low | Keep `client_max_body_size` higher than app upload limits. |
| Data missing after rebuild | Runtime storage was not backed up or mounted | Restore both PostgreSQL and `../Images` / `../files_storage`. |

## Verification Commands

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

For docs-only changes, these commands are not always necessary. For code or schema changes, run the relevant checks before deployment.
