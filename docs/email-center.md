# Email Center

The Email Center provides admin-managed SMTP/IMAP settings, reusable templates, variable validation, outbound message logs, sent messages, inbox sync, and workflow email actions.

## Access

| Area | Route | Authority |
| --- | --- | --- |
| Email Center home | `/admin/email` | `email.manage` |
| Inbox | `/admin/email/inbox` | `email.manage` |
| Message detail/reply | `/admin/email/messages/[id]` | `email.manage` |
| Sent | `/admin/email/sent` | `email.manage` |
| Logs | `/admin/email/logs` | `email.manage` |
| Settings | `/admin/email/settings` | `email.manage` |
| Templates | `/admin/email/templates` | `email.manage` |

Workflow pages such as leads, inquiries, and job applications can expose email actions only when the signed-in admin also has `email.manage`.

## Settings

Email settings are stored in `EmailSettings`. SMTP and IMAP password fields are encrypted before persistence. Environment SMTP variables act as fallback values when admin settings are incomplete:

```env
MAIL_DRIVER=smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Settings screens include SMTP, IMAP, default from/reply-to information, notification recipients, and test actions:

```text
POST /api/admin/email/settings/test-smtp
POST /api/admin/email/settings/test-imap
POST /api/admin/email/settings/test-email
```

## Inbox, Sent, and Logs

| API route | Purpose |
| --- | --- |
| `GET /api/admin/email/inbox` | Lists inbound messages. |
| `POST /api/admin/email/inbox/sync` | Syncs inbound messages through IMAP settings. |
| `GET /api/admin/email/messages/[id]` | Reads one stored message. |
| `POST /api/admin/email/messages/[id]/reply` | Sends a reply and records the outgoing message. |
| `GET /api/admin/email/sent` | Lists outbound messages. |
| `GET /api/admin/email/logs` | Lists message activity and failures. |
| `POST /api/email/inbound` | Inbound email webhook endpoint for external mail providers. |

`EmailMessage` stores direction, status, addresses, subject, body, related workflow references, provider response data, error logs, and timestamps.

## Templates

Templates are stored in `EmailTemplate` and seeded from `modules/email/email.defaults.ts`. Supported template categories include:

```text
career
lead
contact
form
qa
service
product
general
```

Each template has a key, language, subject, body, category, known variable list, optional custom variables, and active flag.

## Variable Syntax

Template variables must use exact double-brace syntax:

```text
{{applicantName}}
{{leadEmail}}
{{submittedValues}}
```

Variable names are case-sensitive. Invalid or unknown variables fail validation and can prevent sending. For example:

```text
{{NameofApplicant}}   invalid
{{applicantName}}     valid
```

The registered variables live in `modules/email/email.variables.ts`.

## Common Registered Variables

Shared variables:

```text
{{siteName}}
{{adminLink}}
```

Career variables include:

```text
{{applicantName}}
{{applicantEmail}}
{{applicantPhone}}
{{positionTitle}}
{{applicationDate}}
{{resumeLink}}
{{coverMessage}}
```

Lead/form/contact/Q&A variables include:

```text
{{leadName}}
{{leadEmail}}
{{leadPhone}}
{{companyName}}
{{sourceForm}}
{{submittedValues}}
{{questionTitle}}
{{questionBody}}
{{questionCategory}}
```

Use the template editor variable list instead of typing from memory when possible.

## Custom Variables

Templates can define custom variables. A custom variable can map to a registered source variable or hold a fixed value. The renderer normalizes custom variables before rendering and validates the final subject/body against allowed keys.

Recommended custom variable rules:

- Use clear camelCase keys, such as `salesOwnerName`.
- Avoid spaces, punctuation, or translated display names in the key.
- Keep fixed values short and reusable.
- Do not reuse a built-in variable key for a different meaning.

## Workflow Notifications

Implemented notification paths include job applications, public forms, contact/inquiry flows, Q&A question received, and lead/workflow email actions. Career templates include applicant received, accepted, rejected, interview, and request-more-info style messages.

Outbound sends are queued in the database, attempted through SMTP, and then marked `SENT` or `FAILED` with provider/error details. This means failed sends should be investigated in Email Center logs, SMTP settings, and template validation.
