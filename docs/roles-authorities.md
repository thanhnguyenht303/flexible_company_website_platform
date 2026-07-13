# Roles and Authorities

The platform uses database-backed role-based access control. Authorities are seeded from `config/admin-authorities.ts`, roles are stored in `Role`, and role-authority assignments are stored in `RoleAuthority`.

## Core Concepts

- `User`: admin account with username, password hash, status, and role.
- `Role`: named authority bundle, such as Super Admin or Editor.
- `Authority`: a single access key that protects a module or workflow.
- `RoleAuthority`: join table connecting roles to authorities.
- Super Admin: special role name/slug (`Super Admin` / `super-admin`) that bypasses individual authority checks.

Legacy JSON permissions still exist on `Role.permissions` for compatibility. Current code should prefer authority keys and `RoleAuthority`.

## Authority Keys

| Key | Purpose |
| --- | --- |
| `dashboard.view` | Access the admin dashboard. |
| `siteSettings.manage` | Manage site identity and contact settings. |
| `theme.manage` | Manage global theme and navbar theme settings. |
| `pages.manage` | Manage page visibility and the visual page builder. |
| `services.manage` | Manage services. |
| `products.manage` | Manage products. |
| `posts.manage` | Manage blog posts and post revisions. |
| `careers.manage` | Manage careers, applications, and career theme settings. |
| `forms.manage` | Manage form definitions and submissions. |
| `leads.manage` | Manage lead qualification workflow. |
| `qa.manage` | Manage public Q&A and Q&A theme settings. |
| `team.manage` | Manage team members. |
| `footer.manage` | Manage footer partners and footer theme settings. |
| `media.manage` | Access the media library. |
| `inquiries.manage` | Manage contact and workflow inquiries. |
| `email.manage` | Manage Email Center settings, templates, messages, and workflow email actions. |
| `users.manage` | Manage admin users. |
| `roles.manage` | Manage roles and authorities. |

## Legacy Permission Aliases

The access helper still recognizes older keys for compatibility:

| Legacy key | Current authority |
| --- | --- |
| `site.settings.update` | `siteSettings.manage` |
| `theme.update` | `theme.manage` |

Use current authority keys in new routes and docs.

## Bootstrap and Seed Behavior

`pnpm db:seed` calls the authority sync helper, upserts authorities, seeds default site/theme content, creates the Editor role, seeds Email Center defaults, and creates the default published `ask-a-question` form for Q&A.

`pnpm setup:admin` creates the first Super Admin when `ALLOW_ADMIN_BOOTSTRAP=true`. After bootstrap, set:

```env
ALLOW_ADMIN_BOOTSTRAP=false
```

## Delegation Rules

Super Admin can assign any role or authority. Non-Super Admin users are constrained by delegation checks in `lib/permissions.ts`:

- They cannot assign Super Admin.
- They cannot assign a role containing authorities they do not already have.
- They cannot create or update roles with authorities outside their own authority set.

This prevents a lower-privilege admin from escalating access through user or role management.

## Protecting New Features

When adding a new admin feature:

1. Add a new authority to `config/admin-authorities.ts`.
2. Run or reuse the authority sync path in seed/setup.
3. Protect admin pages with `requireAdminAuthority("new.key")`.
4. Protect API route handlers with `hasAuthority()` or `hasPermission()`.
5. Add the module route to the admin shell only through the authority metadata.
6. Document the route and authority in this file and [API](api.md).
