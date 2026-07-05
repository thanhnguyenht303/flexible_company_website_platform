# Image Storage

The platform stores uploaded public images outside the Next.js app folder so media survives app rebuilds, deployments, and code updates. Images are stored on disk under `IMAGE_STORAGE_ROOT`, while metadata and relationships are stored in the `MediaAsset` table.

## Local Folder Location

For this workspace, the image library should live here:

```text
D:\Vibe_Coding\Flexible_company_website_platform\Images
```

The app folder is here:

```text
D:\Vibe_Coding\Flexible_company_website_platform\flexible_company_website_platform
```

Because `Images` is a sibling of the app folder, local `.env` should use:

```env
IMAGE_STORAGE_ROOT=../Images
```

For Docker Compose, the sibling `../Images` folder is mounted to `/app/Images`, and `docker-compose.yml` sets:

```env
IMAGE_STORAGE_ROOT=/app/Images
```

## Required Folder Structure

Create this top-level structure before using uploads:

```text
Images/
  posts/
  products/
  services/
  team/
  logos/
  theme-backgrounds/
  page-builder/
  general/
```

Current behavior:

- Post featured and inline images are saved in `Images/posts/<post-id>/`.
- Product gallery images are saved in `Images/products/<product-id>/`.
- Service gallery images are saved in `Images/services/<service-id>/`.
- Team photos are saved in `Images/team/<team-member-id>/`.
- Footer collaborator logos are saved in `Images/logos/<footer-partner-id>/`.
- Site logos are saved in `Images/logos/site/`.
- Theme background images are saved in `Images/theme-backgrounds/site/`.
- Visual page-builder uploads are saved in `Images/page-builder/<page-slug>/`.
- Shared or uncategorized uploads can use `Images/general/` in future features.

## Create Folders With PowerShell

Run from the app folder:

```powershell
New-Item -ItemType Directory -Force `
  ..\Images\posts, `
  ..\Images\products, `
  ..\Images\services, `
  ..\Images\team, `
  ..\Images\logos, `
  ..\Images\theme-backgrounds, `
  ..\Images\page-builder, `
  ..\Images\general
```

## Accepted Image Files

The storage helper currently accepts and signature-checks:

- JPG: `image/jpeg`
- PNG: `image/png`
- WEBP: `image/webp`

The maximum file size is controlled by:

```env
MAX_UPLOAD_MB=10
```

SVG files are not accepted by `saveEntityImage`.

## Serving Images

The database stores media metadata in `MediaAsset`. Public rendering uses:

```text
/api/media/<media-id>
```

The app never exposes raw disk paths. The media route resolves the stored relative path under `IMAGE_STORAGE_ROOT`, sets the asset MIME type, sends `X-Content-Type-Options: nosniff`, and uses long-lived immutable cache headers.

## Upload Flows

### Posts

When an admin uploads a featured or inline post image:

1. The post is created or updated.
2. The uploaded image is validated as JPG, PNG, or WEBP.
3. The file signature is checked against the declared MIME type.
4. The file is saved under `Images/posts/<post-id>/`.
5. A `MediaAsset` database record is created.
6. Featured images are linked through `featuredImageId`.
7. Inline images replace `post-image:<token>` placeholders in post content.

### Products and Services

Product and service galleries use the same storage pattern:

1. One or more images are uploaded while creating or editing the record.
2. Files are saved under `Images/products/<product-id>/` or `Images/services/<service-id>/`.
3. A `MediaAsset` database record is created for each image.
4. The record stores all media ids in `gallery`.
5. The first retained gallery image is stored in `imageId` and used as the thumbnail.
6. Admin updates can remove individual gallery images with `removeImageIds`.
7. Deleting the product or service removes its image folder and related media records.

### Team Photos

When an admin creates or edits a team member:

1. The uploaded photo is validated as JPG, PNG, or WEBP.
2. The file is saved under `Images/team/<team-member-id>/`.
3. A `MediaAsset` record is created.
4. The team member stores the media id in `photoId`.
5. Uploading a new photo replaces the previous photo.
6. Deleting a team member removes the team image folder and related media records.

### Site Logo

Site settings can upload a logo:

1. The logo is sent to `/api/admin/settings/site` as `logo`.
2. The file is saved under `Images/logos/site/`.
3. A `MediaAsset` record is created.
4. The site settings row stores the media id in `logoId`.
5. Replacing the logo deletes the old `logos/site/` asset when it belongs to that folder.

### Theme Background

Theme settings can upload or remove a background image:

1. The image is sent to `/api/admin/settings/theme` as `backgroundImage`.
2. The file is saved under `Images/theme-backgrounds/site/`.
3. A `MediaAsset` record is created.
4. The theme settings row stores the media id in `backgroundImageId`.
5. Sending `removeBackgroundImage=true` removes the current background image.

### Footer Collaborator Logos

When an admin adds a company or business to the public footer:

1. The footer collaborator record is created from Admin > Footer.
2. A logo is required when creating the record.
3. The admin UI normalizes the logo crop before upload.
4. The file is saved under `Images/logos/<footer-partner-id>/`.
5. A `MediaAsset` record is created.
6. The footer collaborator stores the media id in `logoId`.
7. Uploading a new logo replaces the previous logo.
8. Deleting a footer collaborator removes its logo folder and related media records.

Footer logo crop ratio:

```text
3:2
```

### Page Builder Images

Visual page-builder images are uploaded through:

```text
POST /api/admin/page-builder/<page-slug>/images
```

The route stores images under `Images/page-builder/<page-slug>/`, creates a `MediaAsset`, and returns:

```json
{
  "id": "media-id",
  "url": "/api/media/media-id"
}
```

## Backup Recommendation

Back up both the database and the `Images` folder. The database stores metadata and relationships; the `Images` folder stores the actual image files.

The `pnpm backup:db` script does not currently archive the sibling `../Images` folder, so copy or snapshot it separately.

Example PowerShell copy backup:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item `
  D:\Vibe_Coding\Flexible_company_website_platform\Images `
  D:\Vibe_Coding\Flexible_company_website_platform\backups\Images_$timestamp `
  -Recurse
```

## Git Tracking

Do not commit uploaded images by default. The image library is runtime data, similar to database backups or user uploads. Keep this folder backed up separately.
