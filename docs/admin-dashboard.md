# Admin Dashboard

The admin area is mounted under `/admin` and is protected by a signed admin session. Module access is controlled by authorities stored in the database and seeded from `config/admin-authorities.ts`.

## Admin Routes and Authorities

| Admin area | Route | Authority |
| --- | --- | --- |
| Dashboard | `/admin/dashboard` | `dashboard.view` |
| Site settings | `/admin/settings/site` | `siteSettings.manage` |
| Theme settings | `/admin/settings/theme` | `theme.manage` |
| Pages | `/admin/pages` | `pages.manage` |
| Page builder | `/admin/page-builder/[slug]` | `pages.manage` |
| Services | `/admin/services` | `services.manage` |
| Products | `/admin/products` | `products.manage` |
| Posts | `/admin/posts` | `posts.manage` |
| Careers | `/admin/careers` | `careers.manage` |
| Job applications | `/admin/careers/[id]/applications` | `careers.manage` |
| Forms | `/admin/forms` | `forms.manage` |
| Form submissions | `/admin/forms/[id]/submissions` | `forms.manage` |
| Leads | `/admin/leads` | `leads.manage` |
| Q&A | `/admin/qa` | `qa.manage` |
| Team | `/admin/team` | `team.manage` |
| Footer partners | `/admin/footer` | `footer.manage` |
| Media | `/admin/media` | `media.manage` |
| Inquiries | `/admin/inquiries` | `inquiries.manage` |
| Email Center | `/admin/email` | `email.manage` |
| Users | `/admin/users` | `users.manage` |
| Roles | `/admin/roles` | `roles.manage` |

The sidebar is generated from the same authority list, so route protection and menu visibility should stay aligned.

## Dashboard Content

The dashboard summarizes operational work across content, inquiries, leads, and Q&A. It includes a Q&A workspace panel with recent questions and status counts when Q&A data exists.

## Content Workflows

- Services, products, and posts support draft/published/archived status, slugs, SEO fields, localized fields, and image uploads.
- Posts include structured article content and revision history through `PostRevision`.
- Careers include job postings and related applications with private resume downloads.
- Team and footer partners use visibility and sort-order controls.
- Media stores public image records; private files are accessed from their owning workflow.

## Forms, Leads, and Q&A Workflows

Forms can create public submission pages at `/forms/[slug]`. Every public form submission is stored, validated server-side, and converted into a lead. Forms with `sourceType="qa"` also create a moderated Q&A item.

Leads support status, priority, notes, assignee text, follow-up date, CSV export, and links back to submission/Q&A context.

Q&A supports admin creation, moderation, publishing, public listing/detail pages, category filters, and a themed public Ask a Question panel.

## Email Actions in Other Modules

Admins with `email.manage` can email from supported workflows such as leads, inquiries, and job applications. A user may manage leads or applications without `email.manage`; in that case, email compose/reply actions are hidden or unavailable.

## User and Role Management

Users are managed from `/admin/users`; roles and authority sets are managed from `/admin/roles`. Non-Super Admin users can only assign roles and authorities they are allowed to delegate.
