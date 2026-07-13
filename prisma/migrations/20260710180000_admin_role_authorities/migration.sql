ALTER TABLE "Role" ADD COLUMN "slug" TEXT;
ALTER TABLE "Role" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Role"
SET "slug" = CASE
  WHEN lower("name") = 'super admin' THEN 'super-admin'
  ELSE trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g')) || '-' || substr("id", 1, 6)
END;

UPDATE "Role" SET "isSystem" = true WHERE lower("name") = 'super admin';

ALTER TABLE "Role" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

CREATE TABLE "Authority" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "group" TEXT,
  "description" TEXT,
  "menuPath" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Authority_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoleAuthority" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "authorityId" TEXT NOT NULL,
  CONSTRAINT "RoleAuthority_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Authority_key_key" ON "Authority"("key");
CREATE UNIQUE INDEX "RoleAuthority_roleId_authorityId_key" ON "RoleAuthority"("roleId", "authorityId");
CREATE INDEX "RoleAuthority_authorityId_idx" ON "RoleAuthority"("authorityId");

ALTER TABLE "RoleAuthority" ADD CONSTRAINT "RoleAuthority_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleAuthority" ADD CONSTRAINT "RoleAuthority_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Authority" ("id", "key", "name", "group", "description", "menuPath", "isSystem", "updatedAt") VALUES
  ('auth_dashboard', 'dashboard.view', 'Dashboard', 'Workspace', 'Access the admin dashboard', '/admin/dashboard', true, CURRENT_TIMESTAMP),
  ('auth_site_settings', 'siteSettings.manage', 'Site Settings', 'Workspace', 'Manage site settings', '/admin/settings/site', true, CURRENT_TIMESTAMP),
  ('auth_theme', 'theme.manage', 'Theme', 'Workspace', 'Manage the website theme', '/admin/settings/theme', true, CURRENT_TIMESTAMP),
  ('auth_pages', 'pages.manage', 'Pages', 'Workspace', 'Manage website pages and the page builder', '/admin/pages', true, CURRENT_TIMESTAMP),
  ('auth_services', 'services.manage', 'Services', 'Content', 'Manage services', '/admin/services', true, CURRENT_TIMESTAMP),
  ('auth_products', 'products.manage', 'Products', 'Content', 'Manage products', '/admin/products', true, CURRENT_TIMESTAMP),
  ('auth_posts', 'posts.manage', 'Posts', 'Content', 'Manage blog posts', '/admin/posts', true, CURRENT_TIMESTAMP),
  ('auth_careers', 'careers.manage', 'Careers', 'Content', 'Manage careers and job applications', '/admin/careers', true, CURRENT_TIMESTAMP),
  ('auth_forms', 'forms.manage', 'Forms', 'Content', 'Manage forms', '/admin/forms', true, CURRENT_TIMESTAMP),
  ('auth_leads', 'leads.manage', 'Leads', 'Content', 'Manage leads', '/admin/leads', true, CURRENT_TIMESTAMP),
  ('auth_qa', 'qa.manage', 'Q&A', 'Content', 'Manage questions and answers', '/admin/qa', true, CURRENT_TIMESTAMP),
  ('auth_team', 'team.manage', 'Team', 'Content', 'Manage team members', '/admin/team', true, CURRENT_TIMESTAMP),
  ('auth_footer', 'footer.manage', 'Footer', 'Content', 'Manage footer content', '/admin/footer', true, CURRENT_TIMESTAMP),
  ('auth_media', 'media.manage', 'Media', 'Admin', 'Manage the media library', '/admin/media', true, CURRENT_TIMESTAMP),
  ('auth_inquiries', 'inquiries.manage', 'Inquiries', 'Admin', 'Manage inquiries', '/admin/inquiries', true, CURRENT_TIMESTAMP),
  ('auth_users', 'users.manage', 'Users', 'Admin', 'Manage admin users', '/admin/users', true, CURRENT_TIMESTAMP),
  ('auth_roles', 'roles.manage', 'Roles', 'Admin', 'Manage roles and authorities', '/admin/roles', true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RoleAuthority" ("id", "roleId", "authorityId")
SELECT 'ra_' || md5(r."id" || a."id"), r."id", a."id"
FROM "Role" r
CROSS JOIN "Authority" a
WHERE r."slug" = 'super-admin'
   OR COALESCE((r."permissions"->>'all')::boolean, false)
   OR COALESCE((r."permissions"->>a."key")::boolean, false)
   OR (a."key" = 'siteSettings.manage' AND COALESCE((r."permissions"->>'site.settings.update')::boolean, false))
   OR (a."key" = 'theme.manage' AND COALESCE((r."permissions"->>'theme.update')::boolean, false))
ON CONFLICT ("roleId", "authorityId") DO NOTHING;
