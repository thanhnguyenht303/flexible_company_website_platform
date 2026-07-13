# Theme and Colors

The platform stores global theme settings in `ThemeSetting` and renders them as CSS variables consumed by `app/globals.css`.

## Global Theme Variables

Default CSS variables include:

```text
--color-primary
--color-secondary
--color-accent
--color-background
--color-text
--color-muted
--color-panel
--color-border
--theme-background-image
--theme-background-overlay
```

Admin theme settings can update color, typography, radius/layout settings, custom CSS, and the site background image.

## Site and Navbar Settings

Site settings manage identity and contact fields, including optional logo upload. Theme settings manage global colors and layout. Navbar-specific theme values are handled by the navbar theme API:

```text
PUT /api/admin/settings/navbar-theme
```

Protected by:

```text
theme.manage
```

## Feature-Specific Themes

Some public areas have additional theme controls:

| Area | Route/API | Authority |
| --- | --- | --- |
| Careers theme | `/api/admin/careers/theme` | `careers.manage` |
| Q&A theme | `/api/admin/qa/theme` | `qa.manage` |
| Footer theme/content | `/api/admin/footer/theme` and `/admin/footer` | `footer.manage` |

Q&A public pages use CSS variables such as:

```text
--qa-primary
--qa-primary-strong
--qa-accent
--qa-background
--qa-background-image
--qa-background-overlay
--qa-text
--qa-border
--qa-surface
```

## Image Uploads

Theme background images are public media assets stored under:

```text
Images/theme-backgrounds/site/
```

Site logos are stored under:

```text
Images/logos/site/
```

Both are served through `/api/media/[id]`.

## Page Builder Styling

Page-builder blocks can define local colors, backgrounds, borders, radius, opacity, shadow, text styles, spacing, and button states. Those settings apply to the block and should not require global CSS changes unless a new block type is added.

## Color Maintenance Rules

- Prefer semantic CSS variables over hard-coded colors in shared UI.
- Keep public feature theme variables namespaced, such as `--qa-*`.
- Do not use custom CSS to bypass admin theme settings unless the style is truly fixed UI chrome.
- Verify contrast for primary buttons, text on backgrounds, and card borders after changing defaults.
- Update this doc when adding a new theme API, stored theme field, or feature-specific theme namespace.
