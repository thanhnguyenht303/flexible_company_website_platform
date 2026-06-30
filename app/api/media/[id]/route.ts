import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveImagePath } from "@/lib/image-storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });

  if (!asset) {
    return new NextResponse("Media not found.", { status: 404 });
  }

  try {
    const bytes = await readFile(resolveImagePath(asset.filename));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": asset.mimeType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse("Media file not found.", { status: 404 });
  }
}
