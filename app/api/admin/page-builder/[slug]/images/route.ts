import { fail, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { isSupportedBuilderPageSlug } from "@/modules/page-builder/page-builder.policy";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "pages.manage")) return fail("FORBIDDEN", "Forbidden.", 403);
  if (!isSupportedBuilderPageSlug(slug)) return fail("NOT_FOUND", "This page cannot use the visual builder.", 404);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Page image upload");
  if (oversized) return oversized;

  const formData = await request.formData();
  const imageValue = formData.get("image");
  if (!(imageValue instanceof File) || imageValue.size === 0) {
    return fail("IMAGE_REQUIRED", "Please choose an image.", 422, { image: "Image is required." });
  }

  const savedImage = await saveEntityImage({
    entityType: "page-builder",
    entityId: slug,
    file: imageValue
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Image could not be saved.";
    return { error: message };
  });

  if (!savedImage || "error" in savedImage) {
    return fail("UPLOAD_FAILED", savedImage?.error ?? "Image could not be saved.", 422);
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: savedImage.relativePath,
      originalName: savedImage.originalName,
      mimeType: savedImage.mimeType,
      sizeBytes: savedImage.sizeBytes,
      url: "/api/media/pending",
      altText: "Page builder image",
      uploadedById: user.id
    }
  });

  const media = await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { url: `/api/media/${asset.id}` }
  });

  return ok({ id: media.id, url: media.url }, { status: 201 });
}
