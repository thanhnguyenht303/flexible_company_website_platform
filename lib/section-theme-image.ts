import { prisma } from "@/lib/db";
import { deleteStoredImage, saveEntityImage } from "@/lib/image-storage";

export async function saveSectionThemeBackground({
  file,
  section,
  userId,
  altText
}: {
  file: File;
  section: string;
  userId: string;
  altText: string;
}) {
  const savedImage = await saveEntityImage({ entityType: "theme-backgrounds", entityId: section, file });
  if (!savedImage) throw new Error("Background image could not be saved.");

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: savedImage.relativePath,
      originalName: savedImage.originalName,
      mimeType: savedImage.mimeType,
      sizeBytes: savedImage.sizeBytes,
      url: "/api/media/pending",
      altText,
      uploadedById: userId
    }
  });

  await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { url: `/api/media/${asset.id}` }
  });

  return asset.id;
}

export async function deleteSectionThemeBackground(imageId: string | null | undefined, section: string) {
  if (!imageId) return;

  const existingImage = await prisma.mediaAsset.findUnique({ where: { id: imageId } });
  if (existingImage?.filename.startsWith(`theme-backgrounds/${section}/`)) {
    await deleteStoredImage(existingImage.filename).catch(() => null);
  }
  await prisma.mediaAsset.delete({ where: { id: imageId } }).catch(() => null);
}
