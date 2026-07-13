# Visual Page Builder

The visual page builder lets admins edit supported visual pages with configurable blocks instead of code. Current supported page slugs are `home` and `about`.

## Admin Route

```text
/admin/page-builder/home
/admin/page-builder/about
```

The builder is also linked from:

```text
/admin/pages
```

Signed-in admins with `pages.manage` authority can open supported builder pages from the admin pages area.

## API Routes

```text
PUT  /api/admin/page-builder/<page-slug>
POST /api/admin/page-builder/<page-slug>/images
```

Both routes require `pages.manage`.

## Supported Blocks

- Hero
- Text
- Image
- Button
- Video
- Gallery
- Banner
- Static
- Cards
- Two-column layout
- Divider
- Spacer
- Contact CTA
- Team
- Services
- Blog
- Form
- Q&A

Team, services, and blog blocks render dynamic published/visible content from the database. They support normal or infinite scrolling, direction controls, optional carousel arrows, auto-scroll speed, and title links.

Form blocks embed a published form from the form builder and submit through `/api/public/forms/<slug>/submissions`. Q&A blocks render published Q&A items with optional category filtering and item limits.

The `about` page has a stricter block policy. It allows `hero`, `text`, `image`, `banner`, `button`, `video`, `gallery`, `spacer`, `divider`, and `static` blocks. Blocks outside that list are filtered for the About builder.

## Editing Controls

Blocks can be added from the left panel, reordered by dragging, selected on the canvas, and edited in the right inspector. Block settings include:

- Enabled/disabled state.
- Width, alignment, spacing, canvas position, and canvas size.
- Background, color, border color, border radius, shadow, opacity, and hover effect.
- Typography controls for title/body text where applicable.
- Image fit, zoom, offset, and focal controls.
- Safe button/link URLs that must be relative or `http(s)`.

## Draft and Publish

`Save Draft` sends:

```json
{
  "title": "Home",
  "status": "DRAFT",
  "blocks": []
}
```

Drafts are stored in `PageBuilderDraft` and do not replace the live page.

`Publish` sends the same shape with:

```json
{
  "status": "PUBLISHED"
}
```

Publishing upserts the target `Page`, replaces live builder sections in `PageSection`, deletes the draft, and revalidates the public page.

## Images

Builder image uploads are stored outside the Git repository under:

```text
D:\Vibe_Coding\Flexible_company_website_platform\Images\page-builder\<page-slug>
```

The database stores media metadata in `MediaAsset`; public rendering uses:

```text
/api/media/<media-id>
```

Accepted builder image files are JPG, PNG, and WEBP. Upload size is controlled by `MAX_UPLOAD_MB`.

## Maintenance Notes

- Add new supported page slugs in `modules/page-builder/page-builder.policy.ts`.
- Add any page-specific block restrictions in the same policy file.
- Update `BuilderBlockType` and the visual builder UI together when adding a new block type.
- Document new block behavior here and in [API](api.md).
