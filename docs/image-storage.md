# Image Storage Setup

The platform stores uploaded images outside the Next.js app folder so images can survive app rebuilds, deployments, and code updates.

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

## Required Folder Structure

Create this structure before using uploads:

```text
Images/
  posts/
  products/
  services/
  team/
  logos/
  theme-backgrounds/
  general/
```

Current behavior:

- Post featured images are saved in `Images/posts/<post-id>/`.
- Product gallery images are saved in `Images/products/<product-id>/`.
- Service gallery images are saved in `Images/services/<service-id>/`.
- Team or employee photos are saved in `Images/team/<team-member-id>/`.
- Footer collaborator logos are saved in `Images/logos/<footer-partner-id>/`.
- Site logos and favicons can also use `Images/logos/`.
- Shared images, brochures, or uncategorized uploads should later save in `Images/general/`.

## Create Folders With PowerShell

Run from anywhere:

```powershell
New-Item -ItemType Directory -Force `
  D:\Vibe_Coding\Flexible_company_website_platform\Images\posts, `
  D:\Vibe_Coding\Flexible_company_website_platform\Images\products, `
  D:\Vibe_Coding\Flexible_company_website_platform\Images\services, `
  D:\Vibe_Coding\Flexible_company_website_platform\Images\team, `
  D:\Vibe_Coding\Flexible_company_website_platform\Images\logos, `
  D:\Vibe_Coding\Flexible_company_website_platform\Images\general
```

## Environment Variable

Add this to `.env`:

```env
IMAGE_STORAGE_ROOT=../Images
```

For production without Docker, use an absolute path if that is clearer:

```env
IMAGE_STORAGE_ROOT=/var/www/company-site/Images
```

For Docker Compose, the app container maps the sibling `../Images` folder to `/app/Images`, and `docker-compose.yml` sets:

```env
IMAGE_STORAGE_ROOT=/app/Images
```

## How Post Uploads Work

When an admin uploads a featured image for a post:

1. The post is created or updated.
2. Large JPG, PNG, and WEBP files are downscaled in the browser before upload.
3. The uploaded image is validated as JPG, PNG, WEBP, or SVG.
4. The file is saved under `Images/posts/<post-id>/`.
5. A `MediaAsset` database record is created.
6. The post stores the media record id in `featuredImageId`.
7. The app serves the image through `/api/media/<media-id>`.

The public website does not expose raw disk paths.

## How Product Gallery Uploads Work

When an admin uploads product images:

1. The product is created or updated.
2. One or more image files are validated as JPG, PNG, WEBP, or SVG.
3. Files are saved under `Images/products/<product-id>/`.
4. A `MediaAsset` database record is created for each image.
5. The product stores all media ids in `gallery`.
6. The first gallery image is stored in `imageId` and used as the product thumbnail.
7. The admin can remove individual images while editing the product.
8. Deleting a product removes its product image folder and related media records.

## How Service Gallery Uploads Work

Service galleries use the same pattern as product galleries:

1. One or more image files are uploaded while creating or editing a service.
2. Files are saved under `Images/services/<service-id>/`.
3. A `MediaAsset` database record is created for each image.
4. The service stores all media ids in `gallery`.
5. The first gallery image is stored in `imageId` and used as the service thumbnail.
6. The admin can remove individual images while editing the service.
7. Deleting a service removes its service image folder and related media records.

## How Team Photo Uploads Work

When an admin creates or edits an employee:

1. The employee record is created or updated.
2. The uploaded employee photo is validated as JPG, PNG, WEBP, or SVG.
3. The file is saved under `Images/team/<team-member-id>/`.
4. A `MediaAsset` database record is created.
5. The employee stores the media id in `photoId`.
6. Uploading a new photo replaces the previous photo.
7. Deleting an employee removes the employee image folder and related media records.

## How Footer Collaborator Logos Work

When an admin adds a company or business to the public footer:

1. The footer collaborator record is created from Admin > Footer.
2. A logo is required when creating the record.
3. The admin drags and zooms the logo inside a fixed 3:2 crop area.
4. The browser saves the selected crop as a normalized PNG before upload.
5. The uploaded logo is validated as an image file.
6. The file is saved under `Images/logos/<footer-partner-id>/`.
7. A `MediaAsset` database record is created.
8. The footer collaborator stores the media id in `logoId`.
9. Uploading a new logo replaces the previous logo.
10. Deleting a footer collaborator removes its logo folder and related media records.

Footer logo display ratio:

```text
3:2
```

The rendered logo boxes can scale at different viewport sizes, but every collaborator logo uses this same crop ratio for a consistent footer layout.

Recommended post image size:

```text
1600 x 900px
```

The public post detail page constrains featured images to a readable maximum size and uses `object-fit: contain` so the full image remains visible. Blog cards use cropped 16:9 thumbnails for consistent layout.

## Backup Recommendation

Back up both the database and the `Images` folder. The database stores metadata and relationships; the `Images` folder stores the actual files.

Example PowerShell copy backup:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item `
  D:\Vibe_Coding\Flexible_company_website_platform\Images `
  D:\Vibe_Coding\Flexible_company_website_platform\backups\Images_$timestamp `
  -Recurse
```

## Git Tracking

Do not commit uploaded images by default. The image library is runtime data, similar to a database backup or user uploads. Keep this folder backed up separately.
