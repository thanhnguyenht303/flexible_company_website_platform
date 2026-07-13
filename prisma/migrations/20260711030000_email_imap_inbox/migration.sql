ALTER TABLE "EmailSettings"
  ADD COLUMN "imapHost" TEXT,
  ADD COLUMN "imapPort" INTEGER,
  ADD COLUMN "imapUsername" TEXT,
  ADD COLUMN "imapPasswordEncrypted" TEXT,
  ADD COLUMN "imapSecure" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "imapLastSyncAt" TIMESTAMP(3);
