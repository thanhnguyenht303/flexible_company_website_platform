# Careers Module

Owns job posting validation, public career pages, job applications, and resume storage rules.

Job postings support draft, published, and archived states. Public application forms accept applicant details plus a required PDF, DOC, or DOCX resume. Resume files are stored under `FILE_STORAGE_ROOT` and served only through `/api/admin/files/:id` to admins with `careers.manage`.
