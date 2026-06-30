# Visual Page Builder

The visual page builder lets admins edit the homepage with draggable blocks instead of code.

## Admin Route

```text
/admin/page-builder/home
```

The builder is also linked from:

```text
/admin/pages
```

Signed-in admins with `site.settings.update` permission also see an `Edit page` shortcut on the public homepage.

## Supported Blocks

- Hero
- Text
- Image
- Button
- Banner
- Cards
- Two-column layout
- Divider
- Spacer
- Contact CTA

Blocks can be added from the left panel, reordered by dragging, selected on the canvas, and edited in the right inspector.

## Draft and Publish

`Save Draft` stores private builder changes in `PageBuilderDraft`. Drafts do not replace the live homepage.

`Publish` replaces the live builder sections in `PageSection`, deletes the draft, and revalidates the public homepage.

## Images

Builder image uploads are stored outside the Git repository under:

```text
D:\Vibe_Coding\Flexible_company_website_platform\Images\page-builder\<page-slug>
```

The database stores media metadata in `MediaAsset`; public rendering uses `/api/media/<media-id>`.
