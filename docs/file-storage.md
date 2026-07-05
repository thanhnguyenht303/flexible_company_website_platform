# File Storage

The application stores private uploaded files outside the Git repository under `FILE_STORAGE_ROOT`. These files are not served from `/public`; the database stores metadata and admin-only access URLs.

## Local Folder Location

For this workspace, private files should live here:

```text
D:\Vibe_Coding\Flexible_company_website_platform\files_storage
```

Because `files_storage` is a sibling of the app folder, local `.env` should use:

```env
FILE_STORAGE_ROOT=../files_storage
MAX_FILE_UPLOAD_MB=10
```

For Docker Compose, the sibling `../files_storage` folder is mounted to `/app/files_storage`, and `docker-compose.yml` sets:

```env
FILE_STORAGE_ROOT=/app/files_storage
```

## Folder Structure

```text
files_storage/
  job-applications/
    <application-id>/
      <timestamp>-<uuid>-resume-name.pdf
  form-submissions/
    <submission-id>/
      <timestamp>-<uuid>-attachment-name.pdf
  general/
```

`job-applications` stores resumes uploaded from public career application forms. Each application has its own folder, so deleting a job posting can also remove every application folder and resume attached to that position.

`form-submissions` stores private files uploaded through custom form fields. Each form submission has its own folder and files are linked through `FileAsset` records.

`general` is reserved for future private files that are not images, such as internal documents, attachments, exports, or customer files.

## Job Application Flow

1. The public career application form posts to `/api/public/careers/<job-id>/applications`.
2. The route accepts only published jobs.
3. The route rate limits each client IP and job to 3 applications per 15 minutes.
4. The form requires `name`, `email`, and `resume`.
5. The resume is validated by MIME type, size, and file signature.
6. A `JobApplication` row is created.
7. The resume is saved under `files_storage/job-applications/<application-id>/`.
8. A `FileAsset` row is created.
9. The application links to the file through `resumeFileId`.
10. A linked `Inquiry` row is created with `sourceType="career"`.

## Database Records

Private file metadata is stored in the `FileAsset` table:

- `filename`: relative path under `files_storage`.
- `originalName`: the applicant's uploaded filename.
- `mimeType`: uploaded file type.
- `sizeBytes`: file size.
- `url`: admin-only route used to view or download the file.
- `category`: file purpose, such as `job-application-resume`.

Career applications are stored in `JobApplication` and link to the resume through `resumeFileId`.

Custom form submissions are stored in `FormSubmission`; uploaded file metadata is stored in `FileAsset` with category `form-submission-file` and referenced in the submission `files` JSON.

## Access Rules

Resume files are available only through:

```text
/api/admin/files/<file-id>
```

That route requires an admin session with `careers.manage`, `forms.manage`, or `leads.manage`. PDF files open in the browser when supported; DOC and DOCX files download.

The response sets:

- `Cache-Control: private, no-store`
- `X-Content-Type-Options: nosniff`
- `Content-Disposition: inline` for PDFs
- `Content-Disposition: attachment` for DOC and DOCX files

## Accepted Resume Files

The public application form and custom form file fields accept:

- PDF: `application/pdf`
- DOC: `application/msword`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

The max upload size is controlled by `MAX_FILE_UPLOAD_MB`; if it is not set, the app falls back to `MAX_UPLOAD_MB`, then `10MB`.

## Backups

Back up `files_storage` together with the database. The database stores only metadata and relative paths; the real files live in this folder.

The `pnpm backup:db` script does not currently archive the sibling `../files_storage` folder, so copy or snapshot it separately.
