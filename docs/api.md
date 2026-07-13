# API

Most JSON endpoints return a consistent envelope.

## Success Envelope

```json
{
  "success": true,
  "data": {}
}
```

## Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted data.",
    "fields": {
      "email": "Email is invalid."
    }
  }
}
```

File streaming endpoints such as `/api/media/[id]` and `/api/admin/files/[id]` return raw file bytes instead of the JSON envelope.

## Authentication and Permissions

Admin endpoints require a valid admin session cookie created by `/api/admin/login`. Super Admin users bypass individual authority checks. Other admin users must have the authority named in the endpoint table.

Unsafe admin methods (`POST`, `PUT`, `PATCH`, and `DELETE`) also pass through a same-origin CSRF check in `middleware.ts`. Browser requests from the app include the needed headers automatically. Scripted clients must send an `Origin` or `Referer` whose host matches the request host.

Available authority names:

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

Legacy aliases still map `site.settings.update` to `siteSettings.manage` and `theme.update` to `theme.manage`, but new code and docs should use the current authority keys.

## Public Endpoints

| Method | Path | Body | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/public/inquiries` | JSON | Creates a contact inquiry. Rate limited to 5 submissions per minute per client IP. Supports a `website` honeypot field. |
| `POST` | `/api/public/services/[slug]/reviews` | JSON | Creates a service review for a published service. Rate limited to 3 reviews per 5 minutes per client IP and service. Reviews are hidden by default for moderation. |
| `POST` | `/api/public/careers/[id]/applications` | `multipart/form-data` | Creates a job application for a published job posting, stores the resume in private file storage, and creates a linked inquiry. Rate limited to 3 applications per 15 minutes per client IP and job. |
| `POST` | `/api/public/forms/[slug]/submissions` | JSON or `multipart/form-data` | Validates and stores a public custom form submission, creates a lead, stores allowed file fields privately, and creates a moderated Q&A item when the form has `sourceType="qa"`. Rate limited to 5 submissions per 10 minutes per client IP and form. |
| `GET` | `/api/media/[id]` | None | Streams a public media asset from `IMAGE_STORAGE_ROOT` with long-lived immutable cache headers. |

### Public Inquiry JSON

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555 0100",
  "companyName": "Example Co",
  "message": "Please contact me about services.",
  "sourceType": "contact",
  "sourceId": "optional-related-id"
}
```

### Service Review JSON

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "rating": 5,
  "comment": "The team was helpful and responsive."
}
```

### Job Application Form Fields

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | Applicant name, 2-120 characters. |
| `email` | Yes | Applicant email. |
| `resume` | Yes | PDF, DOC, or DOCX file. |
| `phone` | No | Up to 60 characters. |
| `companyName` | No | Up to 160 characters. |
| `message` | No | Up to 5000 characters. |
| `website` | No | Honeypot field; leave empty. |

## Admin Session Endpoints

| Method | Path | Access | Body | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/api/admin/login` | Public | JSON | Creates an admin session after username/password validation and login rate limits. |
| `POST` | `/api/admin/logout` | Admin session | None | Clears the admin session cookie. |

Login body:

```json
{
  "username": "admin",
  "password": "StrongPassword123"
}
```

## Admin Settings and Pages

| Method | Path | Access | Body | Purpose |
| --- | --- | --- | --- | --- |
| `PUT` | `/api/admin/settings/site` | `siteSettings.manage` | JSON or `multipart/form-data` | Updates site identity, contact fields, map URL, domain, and optional site logo. |
| `PUT` | `/api/admin/settings/theme` | `theme.manage` | JSON or `multipart/form-data` | Updates theme colors, typography, radius/layout settings, custom CSS, optional background image, and background removal. |
| `PUT` | `/api/admin/settings/navbar-theme` | `theme.manage` | JSON | Updates navbar-specific theme settings. |
| `PATCH` | `/api/admin/pages/[slug]` | `pages.manage` | JSON | Updates public page visibility for configured public pages. |
| `PUT` | `/api/admin/page-builder/[slug]` | `pages.manage` | JSON | Saves a visual page-builder draft or publishes builder blocks to `PageSection`. |
| `POST` | `/api/admin/page-builder/[slug]/images` | `pages.manage` | `multipart/form-data` | Uploads a page-builder image and returns its media id and URL. |

Page visibility body:

```json
{
  "visible": true
}
```

Page builder body:

```json
{
  "title": "Home",
  "status": "DRAFT",
  "blocks": []
}
```

`status` can be `DRAFT` or `PUBLISHED`; published blocks replace live builder sections for that page.

## Admin Content Endpoints

| Method | Path | Access | Body | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/api/admin/products` | `products.manage` | None | Lists up to 100 products ordered by newest first. |
| `POST` | `/api/admin/products` | `products.manage` | JSON or `multipart/form-data` | Creates a product, auto-generates a slug when missing, and optionally uploads gallery images. |
| `GET` | `/api/admin/products/[id]` | `products.manage` | None | Returns one product. |
| `PATCH` | `/api/admin/products/[id]` | `products.manage` | JSON or `multipart/form-data` | Updates a product, slug, status, localized fields, and gallery images. |
| `DELETE` | `/api/admin/products/[id]` | `products.manage` | None | Deletes a product plus product media metadata and image folder. |
| `GET` | `/api/admin/services` | `services.manage` | None | Lists up to 100 services ordered by newest first. |
| `POST` | `/api/admin/services` | `services.manage` | JSON or `multipart/form-data` | Creates a service, auto-generates a slug when missing, and optionally uploads gallery images. |
| `GET` | `/api/admin/services/[id]` | `services.manage` | None | Returns one service. |
| `PATCH` | `/api/admin/services/[id]` | `services.manage` | JSON or `multipart/form-data` | Updates a service, slug, status, localized fields, and gallery images. |
| `DELETE` | `/api/admin/services/[id]` | `services.manage` | None | Deletes a service plus service media metadata and image folder. |
| `GET` | `/api/admin/posts` | `posts.manage` | None | Lists up to 100 blog posts ordered by newest first. |
| `POST` | `/api/admin/posts` | `posts.manage` | JSON or `multipart/form-data` | Creates a post, auto-generates a slug, optionally uploads a featured image, and replaces inline image tokens. |
| `GET` | `/api/admin/posts/[id]` | `posts.manage` | None | Returns one post. |
| `PATCH` | `/api/admin/posts/[id]` | `posts.manage` | JSON or `multipart/form-data` | Updates a post, slug, status, localized fields, featured image, and inline images. |
| `DELETE` | `/api/admin/posts/[id]` | `posts.manage` | None | Deletes a post plus post media metadata and image folder. |
| `POST` | `/api/admin/posts/[id]/images` | `posts.manage` | `multipart/form-data` | Uploads inline post images and returns media ids/URLs for article content. |
| `GET` | `/api/admin/posts/[id]/revisions` | `posts.manage` | None | Lists post revisions. |
| `GET` | `/api/admin/posts/[id]/revisions/[revisionId]` | `posts.manage` | None | Reads one post revision. |
| `GET` | `/api/admin/team` | `team.manage` | None | Lists team members ordered by sort order and creation date. |
| `POST` | `/api/admin/team` | `team.manage` | JSON or `multipart/form-data` | Creates a team member and optional photo. |
| `GET` | `/api/admin/team/[id]` | `team.manage` | None | Returns one team member. |
| `PATCH` | `/api/admin/team/[id]` | `team.manage` | JSON or `multipart/form-data` | Updates a team member and optionally replaces the photo. |
| `DELETE` | `/api/admin/team/[id]` | `team.manage` | None | Deletes a team member plus team media metadata and photo folder. |
| `GET` | `/api/admin/careers` | `careers.manage` | None | Lists up to 100 job postings ordered by newest first. |
| `POST` | `/api/admin/careers` | `careers.manage` | JSON | Creates a job posting and sets `publishedAt` when status is `PUBLISHED`. |
| `GET` | `/api/admin/careers/[id]` | `careers.manage` | None | Returns one job posting. |
| `PATCH` | `/api/admin/careers/[id]` | `careers.manage` | JSON | Updates a job posting, slug, status, and publication timestamp. |
| `DELETE` | `/api/admin/careers/[id]` | `careers.manage` | None | Deletes a job posting, related applications, resume files, and file metadata. |
| `PUT` | `/api/admin/careers/theme` | `careers.manage` | `multipart/form-data` | Updates career page theme colors and optional background image. |
| `GET` | `/api/admin/footer` | `footer.manage` | None | Lists footer collaborators ordered by sort order and creation date. |
| `POST` | `/api/admin/footer` | `footer.manage` | `multipart/form-data` | Creates a footer collaborator with required logo upload. |
| `GET` | `/api/admin/footer/[id]` | `footer.manage` | None | Returns one footer collaborator. |
| `PATCH` | `/api/admin/footer/[id]` | `footer.manage` | JSON or `multipart/form-data` | Updates a footer collaborator and optionally replaces its logo. |
| `DELETE` | `/api/admin/footer/[id]` | `footer.manage` | None | Deletes a footer collaborator plus logo media metadata and logo folder. |
| `PUT` | `/api/admin/footer/theme` | `footer.manage` | JSON or `multipart/form-data` | Updates footer theme/content settings. |

## Admin Forms, Leads, and Q&A Endpoints

| Method | Path | Access | Body | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/api/admin/forms` | `forms.manage` | None | Lists forms with field and submission counts. |
| `POST` | `/api/admin/forms` | `forms.manage` | JSON | Creates a form and nested fields. Field keys must be unique per form. |
| `GET` | `/api/admin/forms/[id]` | `forms.manage` | None | Returns one form with ordered fields. |
| `PATCH` | `/api/admin/forms/[id]` | `forms.manage` | JSON | Updates form metadata and replaces the ordered field list when fields are provided. |
| `DELETE` | `/api/admin/forms/[id]` | `forms.manage` | None | Deletes the form and its submissions/fields. |
| `GET` | `/api/admin/forms/[id]/submissions` | `forms.manage` | None or `?format=csv` | Lists recent submissions or exports CSV. |
| `GET` | `/api/admin/forms/[id]/submissions/[submissionId]` | `forms.manage` | None | Reads one submission. |
| `PATCH` | `/api/admin/forms/[id]/submissions/[submissionId]` | `forms.manage` | JSON | Updates submission workflow fields. |
| `GET` | `/api/admin/leads` | `leads.manage` | None or `?format=csv` | Lists leads with optional `q`, `status`, and `formId` filters, or exports CSV. |
| `GET` | `/api/admin/leads/[id]` | `leads.manage` | None | Returns a lead plus related submission/form/Q&A context. |
| `PATCH` | `/api/admin/leads/[id]` | `leads.manage` | JSON | Updates status, priority, internal note, assignee, and follow-up date. |
| `GET` | `/api/admin/qa` | `qa.manage` | None | Lists Q&A items with optional search/status filters. |
| `POST` | `/api/admin/qa` | `qa.manage` | JSON | Creates a Q&A item. |
| `GET` | `/api/admin/qa/[id]` | `qa.manage` | None | Returns one Q&A item plus related lead/submission/form context. |
| `PATCH` | `/api/admin/qa/[id]` | `qa.manage` | JSON | Updates a Q&A item and manages `publishedAt` when status changes to/from `PUBLISHED`. |
| `DELETE` | `/api/admin/qa/[id]` | `qa.manage` | None | Deletes a Q&A item. |
| `PUT` | `/api/admin/qa/theme` | `qa.manage` | `multipart/form-data` | Updates Q&A public page theme colors and optional background image. |

## Admin Email Center Endpoints

All Email Center endpoints require `email.manage`.

| Method | Path | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/admin/email/settings` | None | Reads Email Center SMTP/IMAP settings. |
| `PATCH` | `/api/admin/email/settings` | JSON | Updates Email Center settings; sensitive connection fields are stored encrypted. |
| `POST` | `/api/admin/email/settings/test-smtp` | JSON | Tests SMTP connection settings. |
| `POST` | `/api/admin/email/settings/test-imap` | JSON | Tests IMAP connection settings. |
| `POST` | `/api/admin/email/settings/test-email` | JSON | Sends a test email. |
| `GET` | `/api/admin/email/templates` | None | Lists templates. |
| `POST` | `/api/admin/email/templates` | JSON | Creates a template. |
| `GET` | `/api/admin/email/templates/[id]` | None | Reads one template. |
| `PATCH` | `/api/admin/email/templates/[id]` | JSON | Updates a template, including custom variables. |
| `DELETE` | `/api/admin/email/templates/[id]` | None | Deletes a template. |
| `GET` | `/api/admin/email/inbox` | None | Lists inbound messages. |
| `POST` | `/api/admin/email/inbox/sync` | None | Syncs inbound messages from IMAP. |
| `GET` | `/api/admin/email/messages/[id]` | None | Reads one message. |
| `PATCH` | `/api/admin/email/messages/[id]` | JSON | Updates message metadata such as read/status fields. |
| `POST` | `/api/admin/email/messages/[id]/reply` | JSON | Sends and records a reply. |
| `POST` | `/api/admin/email/send` | JSON | Sends a workflow or manual email. |
| `GET` | `/api/admin/email/sent` | None | Lists sent messages. |
| `GET` | `/api/admin/email/logs` | None | Lists message logs and failures. |

Inbound provider webhooks can post to:

```text
POST /api/email/inbound
```

## Admin User and Role Endpoints

| Method | Path | Access | Body | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/api/admin/users` | `users.manage` | None | Lists admin users and roles. |
| `POST` | `/api/admin/users` | `users.manage` | JSON | Creates an admin user with an assignable role. |
| `PATCH` | `/api/admin/users/[id]` | `users.manage` | JSON | Updates user profile, status, password, or role when delegation rules allow it. |
| `DELETE` | `/api/admin/users/[id]` | `users.manage` | None | Deletes an admin user when allowed. |
| `GET` | `/api/admin/roles` | `roles.manage` | None | Lists roles and authority assignments. |
| `POST` | `/api/admin/roles` | `roles.manage` | JSON | Creates a role with delegateable authorities. |
| `PATCH` | `/api/admin/roles/[id]` | `roles.manage` | JSON | Updates a role and its authority assignments when delegation rules allow it. |
| `DELETE` | `/api/admin/roles/[id]` | `roles.manage` | None | Deletes a role when allowed. |

## Admin Inquiry and File Endpoints

| Method | Path | Access | Body | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/api/admin/inquiries` | `inquiries.manage` | None | Lists up to 100 inquiries ordered by newest first. |
| `PATCH` | `/api/admin/inquiries` | `inquiries.manage` | JSON | Updates an inquiry status or internal note. |
| `GET` | `/api/admin/files/[id]` | `careers.manage`, `forms.manage`, or `leads.manage` | None | Streams a private file asset from `FILE_STORAGE_ROOT`. PDFs open inline; DOC/DOCX files download. |

Inquiry update body:

```json
{
  "id": "inquiry-id",
  "status": "IN_PROGRESS",
  "internalNote": "Follow up next week."
}
```

`status` can be `NEW`, `IN_PROGRESS`, `RESOLVED`, or `SPAM`.

## Shared Content Fields

Products and services accept:

```json
{
  "name": "CMS Starter",
  "nameVi": "CMS Starter",
  "slug": "cms-starter",
  "summary": "Short public summary.",
  "summaryVi": "Optional Vietnamese summary.",
  "description": "Long-form description.",
  "descriptionVi": "Optional Vietnamese description.",
  "status": "DRAFT"
}
```

Posts accept `title`, `titleVi`, `slug`, `excerpt`, `excerptVi`, `content`, `contentVi`, and `status`.

Team members accept `name`, `position`, `positionVi`, `bio`, `bioVi`, `email`, `phone`, `sortOrder`, and `isVisible`.

Job postings accept `title`, `slug`, `summary`, `description`, `requirements`, `department`, `location`, `employmentType`, `workMode`, `salaryRange`, `applyEmail`, `applyUrl`, and `status`.

Content status values are `DRAFT`, `PUBLISHED`, and `ARCHIVED`.

## Multipart Upload Fields

| Endpoint family | File field | Notes |
| --- | --- | --- |
| Site settings | `logo` | Stored under `Images/logos/site/`. |
| Theme settings | `backgroundImage` | Stored under `Images/theme-backgrounds/site/`; send `removeBackgroundImage=true` to remove. |
| Products | `images` | May be repeated; first retained image becomes the thumbnail. Send repeated `removeImageIds` on update to remove existing gallery items. |
| Services | `images` | Same gallery behavior as products. |
| Posts | `featuredImage` | Optional featured image. |
| Posts | `inlineImages`, `inlineImageTokens`, `inlineImageAltTexts` | Replaces `post-image:<token>` placeholders in post content. |
| Team | `photo` | Replaces the previous photo on update. |
| Footer | `logo` | Required on create; optional replacement on update. |
| Page builder images | `image` | Returns `{ id, url }` for use in builder blocks. |
| Job applications | `resume` | PDF, DOC, or DOCX only; stored in private file storage. |
| Public custom forms | configured file field keys | PDF, DOC, or DOCX only; stored in private file storage under `form-submissions`. |

Public image uploads are accepted as JPG, PNG, or WEBP and are signature-checked before storage. Resume uploads are accepted as PDF, DOC, or DOCX and are also signature-checked.
