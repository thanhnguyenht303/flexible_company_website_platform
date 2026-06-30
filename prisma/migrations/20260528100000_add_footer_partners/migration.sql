-- CreateTable
CREATE TABLE "FooterPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoId" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FooterPartner_isVisible_sortOrder_idx" ON "FooterPartner"("isVisible", "sortOrder");
