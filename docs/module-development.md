# Module Development

Modules live under `modules/` and should own behavior that belongs to a business area:

- Validation schemas.
- Data services.
- Authority keys.
- Shared types.
- Module-specific UI components.
- Module-specific README notes.

Keep cross-module helpers in `lib/`. Keep public website components in `components/public/`, admin dashboard components in `components/admin/`, and shared renderers in `components/shared/`.

## Current Modules

```text
modules/
  blog/
  careers/
  company-profile/
  email/
  footer/
  forms/
  inquiries/
  media/
  page-builder/
  products/
  services/
  team/
  theme-builder/
  users/
```

Some mature modules currently contain only validation/types because their route handlers and UI live in `app/` and `components/`.

## Recommended Pattern

```text
modules/example/
  example.service.ts
  example.validation.ts
  example.permissions.ts
  example.types.ts
  components/
  README.md
```

Use the smaller version of this pattern when the feature only needs validation or types.

## Route Handler Rules

- Public route handlers should expose only published or visible content.
- Admin route handlers must call `requireAdminUser()`.
- Admin route handlers must check `hasPermission()` before reading or mutating protected data.
- Mutation routes should return the API envelope from `lib/api-response.ts`.
- Slugs should use `slugify()` and must stay unique for their model.
- User-controlled URLs should be validated with `isSafePublicUrl()`.
- File uploads should go through `saveEntityImage()` or `saveResumeFile()` rather than direct disk writes.
- After mutations, revalidate affected public and admin paths with `revalidatePath()`.

## Status and Visibility

Content modules usually use Prisma `PublishStatus`:

```text
DRAFT
PUBLISHED
ARCHIVED
```

Public list/detail pages should read only `PUBLISHED` rows. Team and footer use `isVisible` booleans. Page visibility uses the `Page` table and `PUBLISHED` / `DRAFT` status for configured public pages.

## Localization

The app supports English and Vietnamese UI/content. New public content modules should follow the existing field convention when localized content is needed:

```text
name / nameVi
summary / summaryVi
description / descriptionVi
title / titleVi
content / contentVi
position / positionVi
bio / bioVi
```

Use helpers in `lib/i18n/content.ts` for English fallback behavior.

## Authorities

Add new admin authority names to `config/admin-authorities.ts`, then protect pages/routes with helpers from `lib/auth.ts` and `lib/permissions.ts`. Current authorities include:

```text
dashboard.view
siteSettings.manage
theme.manage
pages.manage
users.manage
roles.manage
products.manage
services.manage
posts.manage
team.manage
footer.manage
careers.manage
media.manage
inquiries.manage
forms.manage
leads.manage
qa.manage
email.manage
```

Legacy aliases map `site.settings.update` to `siteSettings.manage` and `theme.update` to `theme.manage`. Use current authority keys for new work. Super Admin bypasses individual authority checks.

## Storage

Use `IMAGE_STORAGE_ROOT` and `saveEntityImage()` for public images. Current image entity types are:

```text
posts
products
services
team
logos
theme-backgrounds
page-builder
general
```

Use `FILE_STORAGE_ROOT` and private file helpers for resume and form uploads. Private files should be served only through permission-protected API routes.

## Documentation

Any module change that adds or changes routes, environment variables, permissions/authorities, storage behavior, public pages, admin workflows, email variables, or deployment steps must update the relevant file in `docs/` in the same change.
