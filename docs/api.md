# API

All JSON endpoints return a consistent envelope.

## Success

```json
{
  "success": true,
  "data": {}
}
```

## Error

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

## Implemented MVP Endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/admin/login` | Public | Creates an admin session after username/password validation. |
| `POST` | `/api/admin/logout` | Admin session | Clears the admin session cookie. |
| `PUT` | `/api/admin/settings/site` | `site.settings.update` | Updates site identity and contact settings. |
| `PUT` | `/api/admin/settings/theme` | `theme.update` | Updates theme variables. |
| `GET` | `/api/admin/inquiries` | `inquiries.manage` | Lists recent inquiries. |
| `PATCH` | `/api/admin/inquiries` | `inquiries.manage` | Updates inquiry status or internal note. |
| `POST` | `/api/public/inquiries` | Public | Creates a contact inquiry. |
| `POST` | `/api/public/services/[slug]/reviews` | Public | Creates a visible service review. Email is stored but not shown publicly. |
