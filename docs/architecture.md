# Architecture

The platform is a reusable company website CMS built with Next.js App Router, TypeScript, Prisma, PostgreSQL, and Docker Compose. It has public marketing pages, an authenticated admin area, JSON and multipart API routes, external runtime storage, bilingual content fields, a visual page builder, custom forms, leads, Q&A, roles, and an Email Center.

## Main Layers

```text
app/                 Public pages, admin pages, and API route handlers
components/          Public, admin, and shared React components
config/              Public page config, default theme, admin authorities
lib/                 Auth, permissions, DB, i18n, storage, mail, rate limiting, SEO
modules/             Feature-owned validation, services, types, defaults, and docs
prisma/              Database schema, migrations, and seed data
scripts/             Setup, admin bootstrap, backup, and restore utilities
docs/                Project documentation
```

Public pages read only published or visible records. Admin pages require an admin session and usually an authority check. API route handlers return a shared JSON envelope for normal responses, while media and file streaming endpoints return bytes.

## Public Surface

Implemented public routes include:

```text
/
/about
/services
/services/[slug]
/products
/products/[slug]
/team
/team/[slug]
/careers
/careers/[slug]
/blog
/blog/[slug]
/contact
/forms/[slug]
/qa
/qa/[slug]
/privacy
```

Visibility for configured pages is stored in `Page`. Dynamic content modules use status fields such as `DRAFT`, `PUBLISHED`, and `ARCHIVED`; team/footer use visibility booleans.

## Admin Surface

Admin routes live under `/admin`. The shell and sidebar are authority-aware, so users only see modules their role can access. Important areas are dashboard, site settings, theme settings, pages/page builder, content modules, forms, leads, Q&A, media, inquiries, Email Center, users, and roles.

See [Admin Dashboard](admin-dashboard.md) and [Roles and Authorities](roles-authorities.md) for the full route and authority matrix.

## Data Model Areas

The Prisma schema groups the platform into these major areas:

- Identity and access: `User`, `Role`, `Authority`, `RoleAuthority`.
- Site and theme: `SiteSetting`, `ThemeSetting`, `Page`, `PageSection`, `PageBuilderDraft`.
- Content: `Product`, `Service`, `ServiceReview`, `Post`, `PostRevision`, `Category`, `TeamMember`, `FooterPartner`, `JobPosting`, `JobApplication`.
- Forms and lead flow: `Form`, `FormField`, `FormSubmission`, `Lead`, `QaItem`, `Inquiry`.
- Storage: `MediaAsset` for public images and `FileAsset` for private files.
- Email: `EmailSettings`, `EmailTemplate`, `EmailMessage`.
- Operations: `AuditLog`.

## Auth and Security

Admin login creates an HMAC-signed cookie session using `APP_SECRET`. The cookie name is controlled by `SESSION_COOKIE_NAME`, with local development adjustments for non-HTTPS origins.

`middleware.ts` protects `/api/admin/*` except login. Unsafe admin methods (`POST`, `PUT`, `PATCH`, `DELETE`) require a same-origin `Origin` or `Referer`, which provides a CSRF guard for browser-based admin actions.

Admin pages and API routes use helpers from `lib/auth.ts` and `lib/permissions.ts`:

- `requireAdminUser()` for any signed-in admin.
- `requireAdminAuthority("authority.key")` for page-level access.
- `hasAuthority()` / `hasPermission()` for route-handler decisions.

Super Admin users bypass individual authority checks. Non-Super Admin users are limited to the authorities assigned through their role.

## Storage

Runtime uploads are stored outside the app folder:

```text
../Images/           Public image library served through /api/media/[id]
../files_storage/    Private file library served through /api/admin/files/[id]
```

Database records store relative paths and metadata. Raw disk paths are not exposed publicly. Back up storage folders together with PostgreSQL.

## Email Flow

The Email Center stores SMTP/IMAP settings in `EmailSettings`, templates in `EmailTemplate`, and message activity in `EmailMessage`. SMTP settings can come from the admin database row or from environment fallback variables.

Notifications use exact `{{variableName}}` template syntax. Unknown variables are validation errors and are recorded in message logs when sending fails.

## Rendering and Localization

The UI supports English and Vietnamese through the language provider and translation files. Content modules use paired fields such as `title` / `titleVi` and render English fallback when Vietnamese content is missing.

Theme values are stored in `ThemeSetting` and rendered as CSS variables. Q&A, careers, navbar, footer, and page-builder content can layer feature-specific theme values on top of the global theme.
