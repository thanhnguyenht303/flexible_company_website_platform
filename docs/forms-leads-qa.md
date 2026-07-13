# Forms, Leads, and Q&A

The form and lead workflow builder lets admins create reusable public forms, collect submissions, automatically create leads, and optionally turn question forms into moderated public Q&A content.

## Admin Areas

| Area | Route | Authority |
| --- | --- | --- |
| Forms list | `/admin/forms` | `forms.manage` |
| New/edit form | `/admin/forms/new`, `/admin/forms/[id]/edit` | `forms.manage` |
| Form submissions | `/admin/forms/[id]/submissions` | `forms.manage` |
| Leads | `/admin/leads`, `/admin/leads/[id]` | `leads.manage` |
| Q&A | `/admin/qa`, `/admin/qa/[id]` | `qa.manage` |
| Q&A theme | `/api/admin/qa/theme` through the Q&A admin UI | `qa.manage` |

## Public Areas

| Route | Purpose |
| --- | --- |
| `/forms/[slug]` | Renders a published form. |
| `/qa` | Lists published Q&A items, categories, search/filter UI, and Ask a Question panel. |
| `/qa/[slug]` | Renders one published Q&A answer and related questions. |

## Form Builder

Forms are stored in `Form`; fields are stored in `FormField`. Supported field types are:

```text
text
textarea
email
phone
number
date
time
select
radio
checkboxGroup
checkbox
file
url
hidden
consent
```

Useful form settings include:

- `name`, `slug`, `description`, `successMessage`, and `status`.
- `sourceType` and `sourceId` to identify the workflow that created the lead.
- Ordered fields with unique keys per form.
- Required flags, placeholder/help text, options, validation metadata, and admin labels.

Published forms can be embedded in page-builder form blocks or opened directly at `/forms/[slug]`.

## Submission Flow

Public form submissions post to:

```text
POST /api/public/forms/[slug]/submissions
```

The route accepts JSON or `multipart/form-data`, depending on whether the form includes file fields.

Server behavior:

1. Loads the form by slug and requires it to be published.
2. Applies rate limiting per client IP and form.
3. Rejects honeypot spam through the `website` field.
4. Validates required fields, field types, and configured field options.
5. Stores private file uploads under `FILE_STORAGE_ROOT/form-submissions`.
6. Creates a `FormSubmission`.
7. Creates a `Lead`.
8. Sends configured notification email when settings/templates allow it.
9. If `sourceType="qa"`, creates a moderated `QaItem`.

## File Fields

Public custom form file fields accept private document uploads:

```text
PDF
DOC
DOCX
```

Files are stored outside `/public`, linked through `FileAsset`, and streamed only through:

```text
GET /api/admin/files/[id]
```

That route requires a user with `careers.manage`, `forms.manage`, or `leads.manage`, depending on the file context.

## Lead Workflow

Every public form submission creates a lead. Lead records include contact information, source metadata, submission values, status, priority, assigned-to text, follow-up date, and internal notes.

Common lead operations:

- Filter and search leads from `/admin/leads`.
- Export leads as CSV with `GET /api/admin/leads?format=csv`.
- Open a lead detail page to see related form submission and Q&A context.
- Update status, priority, assignee, internal note, and follow-up date.
- Send workflow email when the admin also has `email.manage`.

## Q&A Workflow

Q&A records are stored in `QaItem`. Admins can create Q&A items directly or receive them through a question form. Public pages show only published Q&A items.

Typical moderation flow:

1. User submits the Ask a Question form.
2. The platform creates a form submission, lead, and draft/moderated Q&A item.
3. Admin reviews the Q&A item in `/admin/qa`.
4. Admin edits title, question, answer, category, SEO fields, slug, and status.
5. Publishing sets `publishedAt` and makes the item visible at `/qa` and `/qa/[slug]`.

## Seeded Ask a Question Form

`pnpm db:seed` creates a default published form:

```text
slug: ask-a-question
name: Ask a Question
```

Seeded fields include name, email, question title, question, and category. This form powers the public Q&A Ask a Question panel.

## Dynamic Blocks

The visual page builder supports:

- Form blocks: embed a published form by id/slug with stacked, two-column, or compact layout.
- Q&A blocks: show published Q&A items with category filtering, item limits, and card/list/accordion layout options.

## API Summary

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/admin/forms` | `forms.manage` | List forms with counts. |
| `POST` | `/api/admin/forms` | `forms.manage` | Create form and fields. |
| `GET` | `/api/admin/forms/[id]` | `forms.manage` | Read one form. |
| `PATCH` | `/api/admin/forms/[id]` | `forms.manage` | Update form and fields. |
| `DELETE` | `/api/admin/forms/[id]` | `forms.manage` | Delete form and related data. |
| `GET` | `/api/admin/forms/[id]/submissions` | `forms.manage` | List or CSV export submissions. |
| `GET` | `/api/admin/forms/[id]/submissions/[submissionId]` | `forms.manage` | Read one submission. |
| `PATCH` | `/api/admin/forms/[id]/submissions/[submissionId]` | `forms.manage` | Update submission workflow fields. |
| `GET` | `/api/admin/leads` | `leads.manage` | List or CSV export leads. |
| `GET` | `/api/admin/leads/[id]` | `leads.manage` | Read one lead. |
| `PATCH` | `/api/admin/leads/[id]` | `leads.manage` | Update lead workflow fields. |
| `GET` | `/api/admin/qa` | `qa.manage` | List Q&A items. |
| `POST` | `/api/admin/qa` | `qa.manage` | Create Q&A item. |
| `GET` | `/api/admin/qa/[id]` | `qa.manage` | Read one Q&A item. |
| `PATCH` | `/api/admin/qa/[id]` | `qa.manage` | Update Q&A item. |
| `DELETE` | `/api/admin/qa/[id]` | `qa.manage` | Delete Q&A item. |
| `POST` | `/api/public/forms/[slug]/submissions` | Public | Submit a published form. |

## Maintenance Checklist

When adding a new form-driven workflow:

1. Decide the `sourceType` and `sourceId` convention.
2. Add any required lead/Q&A mapping in the public submission route or form service.
3. Add Email Center variables/templates if notifications need new data.
4. Document the new workflow in this file and in [API](api.md).
