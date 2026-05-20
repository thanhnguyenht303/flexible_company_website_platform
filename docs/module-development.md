# Module Development

Modules live under `modules/` and should own the behavior that belongs to their business area:

- validation schemas
- data services
- permission names
- shared types
- module-specific UI components
- extension notes

Keep cross-module helpers in `lib/`. Keep reusable interface components in `components/ui/`, public website components in `components/public/`, and admin dashboard components in `components/admin/`.

## Pattern

```text
modules/example/
  example.service.ts
  example.validation.ts
  example.permissions.ts
  example.types.ts
  components/
  README.md
```

Public route handlers should expose only published content. Admin route handlers must call `requireAdminUser()` and check permissions with `hasPermission()`.
