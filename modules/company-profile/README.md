# Company Profile Module

Owns site identity, contact data, domain metadata, default SEO, public company profile rendering, and site logo uploads.

Site settings are edited through Admin > Site Settings and saved through `/api/admin/settings/site` with the `site.settings.update` permission. Logo files are stored under `Images/logos/site/` and served through `/api/media/:id`.
