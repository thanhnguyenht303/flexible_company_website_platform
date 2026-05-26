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
  general/
```

Current behavior:

- Post featured images are saved in `Images/posts/<post-id>/`.
- Product gallery images are saved in `Images/products/<product-id>/`.
- Services should later save in `Images/services/<service-id>/`.
- Team or employee photos should later save in `Images/team/<team-member-id>/`.
- Site logos and favicons should later save in `Images/logos/`.
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
