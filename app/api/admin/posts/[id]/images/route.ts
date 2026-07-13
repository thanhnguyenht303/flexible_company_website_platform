import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { deleteStoredImage, saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import {
  articleDocumentToText,
  insertArticleImage,
  legacyArticleToDocument,
  normalizeArticleDocument
} from "@/modules/blog/article-document";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Article image upload");
  if (oversized) return oversized;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return fail("NOT_FOUND", "Post not found.", 404);

  const formData = await request.formData();
  const file = formData.get("image");
  const kind = formData.get("kind") === "featured" ? "featured" : "inline";
  const alt = typeof formData.get("alt") === "string" ? String(formData.get("alt")).trim().slice(0, 300) : "";
  const caption = typeof formData.get("caption") === "string"
    ? String(formData.get("caption")).trim().slice(0, 500)
    : "";
  const locale = formData.get("locale") === "vi" ? "vi" : "en";
  const rawInsertAfter = formData.get("insertAfter");
  const parsedInsertAfter = typeof rawInsertAfter === "string" && rawInsertAfter.trim()
    ? Number(rawInsertAfter)
    : undefined;
  const insertAfter = Number.isInteger(parsedInsertAfter)
    ? Math.max(0, Math.min(9_999, parsedInsertAfter as number))
    : undefined;
  const rawRevisionNumber = formData.get("revisionNumber");
  const parsedRevisionNumber = typeof rawRevisionNumber === "string" && rawRevisionNumber.trim()
    ? Number(rawRevisionNumber)
    : Number.NaN;
  const expectedRevisionNumber = Number.isSafeInteger(parsedRevisionNumber) && parsedRevisionNumber >= 0
    ? parsedRevisionNumber
    : null;

  if (!(file instanceof File) || !file.size) {
    return fail("IMAGE_REQUIRED", "Choose an image to upload.", 422);
  }
  if (kind === "inline" && expectedRevisionNumber === null) {
    return fail("REVISION_REQUIRED", "Save the article before adding an inline image.", 422);
  }

  let savedFilename: string | null = null;
  let transactionCommitted = false;

  try {
    const savedImage = await saveEntityImage({ entityType: "posts", entityId: id, file });
    if (!savedImage) return fail("IMAGE_REQUIRED", "Choose an image to upload.", 422);
    savedFilename = savedImage.relativePath;

    const result = await prisma.$transaction(async (transaction) => {
      const currentPost = await transaction.post.findUnique({ where: { id } });
      if (!currentPost) throw new Error("Post not found.");

      const imageAlt = alt || currentPost.title || "Article image";
      const asset = await transaction.mediaAsset.create({
        data: {
          filename: savedImage.relativePath,
          originalName: savedImage.originalName,
          mimeType: savedImage.mimeType,
          sizeBytes: savedImage.sizeBytes,
          url: "/api/media/pending",
          altText: imageAlt,
          uploadedById: user.id
        }
      });
      const url = `/api/media/${asset.id}`;
      await transaction.mediaAsset.update({ where: { id: asset.id }, data: { url } });

      if (kind === "featured") {
        const previousAsset = currentPost.featuredImageId
          ? await transaction.mediaAsset.findUnique({ where: { id: currentPost.featuredImageId } })
          : null;
        await transaction.post.update({
          where: { id },
          data: { featuredImageId: asset.id, featuredImageAlt: alt || currentPost.title || "Article cover" }
        });

        return {
          assetId: asset.id,
          url,
          alt: alt || currentPost.title || "Article cover",
          document: null,
          locale,
          revisionNumber: currentPost.revisionNumber,
          slug: currentPost.slug,
          previousAsset,
          previousAssetUsedInBody: previousAsset
            ? documentReferencesAsset(currentPost.contentJson, previousAsset.id)
              || documentReferencesAsset(currentPost.contentJsonVi, previousAsset.id)
              || documentReferencesAsset(currentPost.content, previousAsset.id)
              || documentReferencesAsset(currentPost.contentVi, previousAsset.id)
            : false
        };
      }

      const baseDocument = locale === "vi"
        ? normalizeArticleDocument(currentPost.contentJsonVi) ?? legacyArticleToDocument(currentPost.contentVi ?? "")
        : normalizeArticleDocument(currentPost.contentJson) ?? legacyArticleToDocument(currentPost.content);
      if (
        expectedRevisionNumber === null
        || currentPost.revisionNumber !== expectedRevisionNumber
      ) {
        throw new ArticleImageConflictError();
      }
      const document = insertArticleImage(baseDocument, { src: url, alt: imageAlt, caption }, insertAfter);
      if (!document) throw new Error("The uploaded image could not be added to the article document.");

      const contentText = articleDocumentToText(document);
      const updateResult = await transaction.post.updateMany({
        where: { id, revisionNumber: expectedRevisionNumber },
        data: locale === "vi"
          ? {
              contentJsonVi: document as Prisma.InputJsonValue,
              contentVi: contentText,
              revisionNumber: { increment: 1 }
            }
          : {
              contentJson: document as Prisma.InputJsonValue,
              content: contentText,
              contentText,
              revisionNumber: { increment: 1 }
            }
      });
      if (updateResult.count !== 1) throw new ArticleImageConflictError();

      return {
        assetId: asset.id,
        url,
        alt: imageAlt,
        document,
        locale,
        revisionNumber: expectedRevisionNumber + 1,
        slug: currentPost.slug,
        previousAsset: null,
        previousAssetUsedInBody: false
      };
    });
    transactionCommitted = true;

    if (result.previousAsset && !result.previousAssetUsedInBody) {
      const assetDeleted = await prisma.mediaAsset
        .delete({ where: { id: result.previousAsset.id } })
        .then(() => true)
        .catch(() => false);
      if (assetDeleted) {
        await deleteStoredImage(result.previousAsset.filename).catch(() => undefined);
      }
    }

    try {
      revalidatePath(`/blog/${result.slug}`);
      revalidatePath("/blog");
      revalidatePath("/admin/posts");
    } catch {
      // The media and article are already committed; cache refresh is best-effort.
    }
    return ok({
      id: result.assetId,
      url: result.url,
      alt: result.alt,
      kind,
      locale: result.locale,
      revisionNumber: result.revisionNumber,
      ...(result.document ? { document: result.document } : {})
    }, { status: 201 });
  } catch (error) {
    if (!transactionCommitted && savedFilename) {
      await deleteStoredImage(savedFilename).catch(() => undefined);
    }
    if (error instanceof ArticleImageConflictError) {
      return fail(
        "EDIT_CONFLICT",
        "This article changed while the image was uploading. Reload it before trying again.",
        409
      );
    }
    return fail(
      "IMAGE_UPLOAD_FAILED",
      error instanceof Error ? error.message : "The image could not be uploaded.",
      422
    );
  }
}

class ArticleImageConflictError extends Error {}

function documentReferencesAsset(document: unknown, assetId: string) {
  try {
    return JSON.stringify(document).includes(`/api/media/${assetId}`);
  } catch {
    return false;
  }
}
