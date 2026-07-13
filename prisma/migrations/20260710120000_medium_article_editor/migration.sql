CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNLISTED', 'ARCHIVED');

ALTER TABLE "Post" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Post"
  ALTER COLUMN "status" TYPE "PostStatus"
  USING ("status"::text::"PostStatus");
ALTER TABLE "Post" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "Post"
  ADD COLUMN "contentJson" JSONB,
  ADD COLUMN "contentJsonVi" JSONB,
  ADD COLUMN "contentText" TEXT,
  ADD COLUMN "contentVersion" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN "revisionNumber" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "featuredImageAlt" TEXT,
  ADD COLUMN "firstPublishedAt" TIMESTAMP(3),
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "canonicalUrl" TEXT,
  ADD COLUMN "authorId" TEXT;

UPDATE "Post"
SET
  "contentText" = "content",
  "firstPublishedAt" = "publishedAt",
  "featuredImageAlt" = COALESCE("featuredImageAlt", "title")
WHERE TRUE;

ALTER TABLE "Post"
  ADD CONSTRAINT "Post_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Post_status_publishedAt_idx" ON "Post"("status", "publishedAt");
CREATE INDEX "Post_authorId_updatedAt_idx" ON "Post"("authorId", "updatedAt");

CREATE TABLE "PostRevision" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "revisionNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT,
  "contentJson" JSONB NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PostRevision_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PostRevision"
  ADD CONSTRAINT "PostRevision_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostRevision"
  ADD CONSTRAINT "PostRevision_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "PostRevision_postId_locale_revisionNumber_key"
  ON "PostRevision"("postId", "locale", "revisionNumber");
CREATE INDEX "PostRevision_postId_createdAt_idx"
  ON "PostRevision"("postId", "createdAt");
