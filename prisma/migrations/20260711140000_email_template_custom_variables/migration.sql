ALTER TABLE "EmailTemplate"
ADD COLUMN "customVariables" JSONB NOT NULL DEFAULT '[]'::jsonb;
