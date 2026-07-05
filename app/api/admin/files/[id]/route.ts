import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { fail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveFilePath } from "@/lib/file-storage";
import { hasPermission } from "@/lib/permissions";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "careers.manage") && !hasPermission(user, "leads.manage") && !hasPermission(user, "forms.manage")) {
    return fail("FORBIDDEN", "Forbidden.", 403);
  }

  const file = await prisma.fileAsset.findUnique({ where: { id } });
  if (!file) return fail("NOT_FOUND", "File not found.", 404);

  const bytes = await readFile(resolveFilePath(file.filename)).catch(() => null);
  if (!bytes) return fail("NOT_FOUND", "Stored file is missing.", 404);

  return new NextResponse(bytes, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `${file.mimeType === "application/pdf" ? "inline" : "attachment"}; filename="${escapeFilename(file.originalName)}"`,
      "Content-Length": String(file.sizeBytes),
      "Content-Type": file.mimeType,
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function escapeFilename(filename: string) {
  return filename.replace(/["\r\n]/g, "_");
}
