ALTER TABLE "Product"
  ADD COLUMN "nameVi" TEXT,
  ADD COLUMN "summaryVi" TEXT,
  ADD COLUMN "descriptionVi" TEXT;

ALTER TABLE "Service"
  ADD COLUMN "nameVi" TEXT,
  ADD COLUMN "summaryVi" TEXT,
  ADD COLUMN "descriptionVi" TEXT;

ALTER TABLE "Post"
  ADD COLUMN "titleVi" TEXT,
  ADD COLUMN "excerptVi" TEXT,
  ADD COLUMN "contentVi" TEXT;

ALTER TABLE "TeamMember"
  ADD COLUMN "positionVi" TEXT,
  ADD COLUMN "bioVi" TEXT;
