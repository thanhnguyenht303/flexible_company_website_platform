# Media Module

Owns media metadata, public media serving, image upload constraints, and future media picker behavior.

Current public image files are stored outside the app folder under `IMAGE_STORAGE_ROOT` rather than `public/uploads`. Metadata lives in `MediaAsset`, and public rendering uses `/api/media/:id`.

Accepted image uploads are JPG, PNG, and WEBP. The storage helper validates MIME type, file size, and file signature before writing files.
