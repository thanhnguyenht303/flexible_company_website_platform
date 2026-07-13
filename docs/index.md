# Documentation Index

This documentation describes the current implemented platform. When code changes add a route, model, environment variable, or admin workflow, update the matching document in this folder in the same change.

## Core Docs

- [Setup](setup.md): local install, environment variables, first admin creation, and verification commands.
- [Deployment](deployment.md): Docker Compose production flow, environment checklist, storage mounts, backups, and post-deploy checks.
- [Architecture](architecture.md): high-level app structure, data model areas, route layers, auth, storage, and rendering flow.
- [API](api.md): public and admin route-handler matrix, auth requirements, payload examples, uploads, and response envelopes.
- [Troubleshooting](troubleshooting.md): common failures, likely causes, and fixes.

## Admin and Feature Docs

- [Admin Dashboard](admin-dashboard.md): admin modules, routes, and authority requirements.
- [Roles and Authorities](roles-authorities.md): RBAC model, Super Admin behavior, authority keys, delegation rules, and seed/bootstrap notes.
- [Email Center](email-center.md): SMTP/IMAP settings, inbox, sent/logs, templates, variables, custom variables, and notification workflows.
- [Forms, Leads, and Q&A](forms-leads-qa.md): form builder, public submissions, automatic lead creation, Q&A moderation, exports, and seeded Ask a Question form.
- [Visual Page Builder](page-builder.md): Home/About builder routes, allowed block types, draft/publish behavior, dynamic blocks, and image uploads.
- [Module Development](module-development.md): module ownership, route-handler rules, authorities, localization, storage, and validation conventions.

## Design, Content, and Storage

- [i18n](i18n.md): English/Vietnamese UI and content-field conventions.
- [Responsive Design](responsive-design.md): breakpoints, admin/public layout guidance, and QA/form responsive expectations.
- [Theme and Colors](theme-and-colors.md): global theme settings, navbar/theme overrides, Q&A/career/footer themed areas, and CSS variable behavior.
- [Image Storage](image-storage.md): public image folders, accepted image types, `/api/media`, upload flows, and backups.
- [File Storage](file-storage.md): private file folders, resume/form-upload flow, admin-only downloads, and backups.
