CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "successMessage" TEXT,
    "redirectUrl" TEXT,
    "notificationEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sourceType" TEXT NOT NULL DEFAULT 'form',
    "linkedEntityType" TEXT,
    "linkedEntityId" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "helpText" TEXT,
    "placeholder" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "validation" JSONB,
    "defaultValue" TEXT,
    "internalLabel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "files" JSONB,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'form',
    "sourceId" TEXT,
    "sourceFormId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "assignedToId" TEXT,
    "internalNote" TEXT,
    "followUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QaItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "sourceType" TEXT DEFAULT 'qa',
    "sourceId" TEXT,
    "sourceFormId" TEXT,
    "submissionId" TEXT,
    "leadId" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QaItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Form_slug_key" ON "Form"("slug");
CREATE INDEX "Form_status_sourceType_idx" ON "Form"("status", "sourceType");

CREATE UNIQUE INDEX "FormField_formId_key_key" ON "FormField"("formId", "key");
CREATE INDEX "FormField_formId_sortOrder_idx" ON "FormField"("formId", "sortOrder");

CREATE INDEX "FormSubmission_formId_createdAt_idx" ON "FormSubmission"("formId", "createdAt");
CREATE INDEX "FormSubmission_status_createdAt_idx" ON "FormSubmission"("status", "createdAt");

CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
CREATE INDEX "Lead_priority_createdAt_idx" ON "Lead"("priority", "createdAt");
CREATE INDEX "Lead_sourceType_sourceId_idx" ON "Lead"("sourceType", "sourceId");
CREATE INDEX "Lead_sourceFormId_idx" ON "Lead"("sourceFormId");

CREATE UNIQUE INDEX "QaItem_slug_key" ON "QaItem"("slug");
CREATE INDEX "QaItem_status_publishedAt_idx" ON "QaItem"("status", "publishedAt");
CREATE INDEX "QaItem_category_idx" ON "QaItem"("category");

ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
