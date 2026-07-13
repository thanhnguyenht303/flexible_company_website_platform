-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENT', 'FAILED', 'RECEIVED', 'ARCHIVED');

-- Career workflows need statuses that are distinct from contact inquiry statuses.
CREATE TYPE "JobApplicationStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED', 'INTERVIEW', 'NEED_MORE_INFO', 'ARCHIVED');
ALTER TABLE "JobApplication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "JobApplication" ALTER COLUMN "status" TYPE "JobApplicationStatus" USING (
  CASE
    WHEN "status"::text IN ('RESOLVED', 'SPAM') THEN 'ARCHIVED'::"JobApplicationStatus"
    ELSE "status"::text::"JobApplicationStatus"
  END
);
ALTER TABLE "JobApplication" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultReceivingEmail" TEXT,
    "defaultSenderName" TEXT,
    "defaultSenderEmail" TEXT,
    "replyToEmail" TEXT,
    "notificationEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUsername" TEXT,
    "smtpPasswordEncrypted" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "inboundEmailAddress" TEXT,
    "inboundWebhookSecretEncrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "language" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "variables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "direction" "EmailDirection" NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "toEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "replyToEmail" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "templateId" TEXT,
    "providerMessageId" TEXT,
    "inReplyTo" TEXT,
    "referencesHeader" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "sentByUserId" TEXT,
    "errorMessage" TEXT,
    "attachments" JSONB,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailTemplate_key_language_key" ON "EmailTemplate"("key", "language");
CREATE INDEX "EmailTemplate_category_isActive_idx" ON "EmailTemplate"("category", "isActive");
CREATE INDEX "EmailMessage_direction_status_createdAt_idx" ON "EmailMessage"("direction", "status", "createdAt");
CREATE INDEX "EmailMessage_relatedType_relatedId_idx" ON "EmailMessage"("relatedType", "relatedId");
CREATE INDEX "EmailMessage_providerMessageId_idx" ON "EmailMessage"("providerMessageId");
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "EmailSettings" ("id", "updatedAt") VALUES ('default', CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Authority" ("id", "key", "name", "group", "description", "menuPath", "isSystem", "updatedAt")
VALUES ('auth_email', 'email.manage', 'Email Center', 'Admin', 'Manage email settings, templates, messages, and workflow notifications', '/admin/email', true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RoleAuthority" ("id", "roleId", "authorityId")
SELECT 'ra_' || md5(r."id" || a."id"), r."id", a."id"
FROM "Role" r CROSS JOIN "Authority" a
WHERE a."key" = 'email.manage' AND (r."slug" = 'super-admin' OR COALESCE((r."permissions"->>'all')::boolean, false) OR COALESCE((r."permissions"->>'email.manage')::boolean, false))
ON CONFLICT ("roleId", "authorityId") DO NOTHING;
