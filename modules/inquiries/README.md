# Inquiries Module

Owns inquiry permissions and public/admin inquiry behavior.

Public contact submissions create `Inquiry` rows with rate limiting and a honeypot field. Career applications also create linked inquiries with `sourceType="career"`. Admins with `inquiries.manage` can list inquiries and update status or internal notes.
