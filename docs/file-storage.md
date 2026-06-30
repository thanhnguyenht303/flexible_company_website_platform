# File Storage

The application stores private uploaded files outside the Git repository in:

```text
D:\Vibe_Coding\Flexible_company_website_platform\files_storage
```

Set this location with:

```env
FILE_STORAGE_ROOT=../files_storage
MAX_FILE_UPLOAD_MB=10
```

## Folder Structure

```text
files_storage/
  job-applications/
    <application-id>/
      <timestamp>-<uuid>-resume-name.pdf
  general/
```

`job-applications` stores resumes uploaded from public career application forms. Each application has its own folder, so removing a job posting can also remove every application folder and resume attached to that position.

`general` is reserved for future private files that are not images, such as internal documents, attachments, exports, or customer files.

## Database Records

Private file metadata is stored in the `FileAsset` table:

- `filename`: relative path under `files_storage`
- `originalName`: the applicant's uploaded filename
- `mimeType`: uploaded file type
- `sizeBytes`: file size
- `url`: admin-only route used to view or download the file
- `category`: file purpose, such as `job-application-resume`

Career applications are stored in `JobApplication` and link to the resume through `resumeFileId`.

## Access Rules

Resume files are not served from `/public`. They are only available through:

```text
/api/admin/files/<file-id>
```

That route requires an admin session with the `careers.manage` permission. PDF resumes open in the browser when supported; DOC and DOCX files download.

## Accepted Resume Files

The public application form accepts:

- PDF: `application/pdf`
- DOC: `application/msword`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

The max upload size is controlled by `MAX_FILE_UPLOAD_MB`; if it is not set, the app falls back to `MAX_UPLOAD_MB`, then `10MB`.

## Backups

Back up `files_storage` together with the database. The database stores only metadata and relative paths; the real files live in this folder.
