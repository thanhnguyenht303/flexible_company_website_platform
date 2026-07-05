# Forms and Leads Module

Owns custom form builder validation, public dynamic form rendering, form submissions, lead workflow records, and Q&A submission integration.

Forms collect structured submissions through `/api/public/forms/:slug/submissions`. Each submission creates a `FormSubmission` and a `Lead`. Forms with `sourceType="qa"` also create a moderated `QaItem`.
