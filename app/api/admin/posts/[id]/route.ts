import { revalidatePath } from "next/cache";
import { PostStatus, Prisma } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteEntityImageFolder } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import {
  articleDocumentToText,
  legacyArticleToDocument,
  normalizeArticleDocument
} from "@/modules/blog/article-document";
import {
  blogDraftSchema,
  normalizeBlogPostInput,
  validatePublishablePost
} from "@/modules/blog/blog.validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { displayName: true, username: true } } }
  });
  if (!post) return fail("NOT_FOUND", "Post not found.", 404);

  return ok(post);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Post not found.", 404);

  const body = await request.json().catch(() => null);
  const parsed = blogDraftSchema.partial().safeParse(body);
  if (!parsed.success) return validationFail(parsed.error);
  if (!Object.keys(parsed.data).length) {
    return fail("EMPTY_UPDATE", "At least one field is required.", 422);
  }

  if (parsed.data.revisionNumber !== undefined && parsed.data.revisionNumber !== existing.revisionNumber) {
    return fail(
      "EDIT_CONFLICT",
      "This article was changed in another tab. Reload before saving again.",
      409
    );
  }

  const input = normalizeBlogPostInput({
    title: parsed.data.title ?? existing.title,
    titleVi: parsed.data.titleVi ?? existing.titleVi,
    slug: parsed.data.slug ?? existing.slug,
    excerpt: parsed.data.excerpt ?? existing.excerpt,
    excerptVi: parsed.data.excerptVi ?? existing.excerptVi,
    content: parsed.data.content ?? existing.content,
    contentVi: parsed.data.contentVi ?? existing.contentVi,
    contentJson: parsed.data.contentJson !== undefined ? parsed.data.contentJson : existing.contentJson,
    contentJsonVi: parsed.data.contentJsonVi !== undefined ? parsed.data.contentJsonVi : existing.contentJsonVi,
    tagNames: parsed.data.tagNames ?? existing.tagNames,
    featuredImageAlt: parsed.data.featuredImageAlt ?? existing.featuredImageAlt,
    seoTitle: parsed.data.seoTitle ?? existing.seoTitle,
    seoDescription: parsed.data.seoDescription ?? existing.seoDescription,
    canonicalUrl: parsed.data.canonicalUrl ?? existing.canonicalUrl,
    status: parsed.data.status ?? existing.status,
    scheduledAt: parsed.data.scheduledAt ?? existing.scheduledAt?.toISOString(),
    revisionNumber: parsed.data.revisionNumber,
    createRevision: parsed.data.createRevision
  });

  if (parsed.data.contentJson != null && !input.contentJson) {
    return fail("INVALID_DOCUMENT", "The article document contains unsupported content.", 422, {
      contentJson: "The article document could not be saved."
    });
  }
  if (parsed.data.contentJsonVi != null && !input.contentJsonVi) {
    return fail("INVALID_DOCUMENT", "The Vietnamese article document contains unsupported content.", 422, {
      contentJsonVi: "The translated document could not be saved."
    });
  }

  const nextSlug = parsed.data.slug !== undefined
    ? slugify(parsed.data.slug || input.title) || existing.slug
    : parsed.data.title !== undefined && existing.slug.startsWith("untitled-story")
      ? slugify(input.title) || existing.slug
      : existing.slug;

  if (nextSlug !== existing.slug) {
    const owner = await prisma.post.findUnique({ where: { slug: nextSlug }, select: { id: true } });
    if (owner && owner.id !== existing.id) {
      return fail("SLUG_EXISTS", "A post with this slug already exists.", 409, {
        slug: "Choose a different URL slug."
      });
    }
  }

  const nextStatus = (parsed.data.status ?? existing.status) as PostStatus;
  const nextDocument = input.contentJson ?? normalizeArticleDocument(existing.contentJson);
  const nextContentText = articleDocumentToText(nextDocument) || input.content;
  const nextScheduledAt = nextStatus === PostStatus.SCHEDULED && input.scheduledAt
    ? new Date(input.scheduledAt)
    : null;

  const publishErrors = validatePublishablePost({
    title: input.title,
    content: nextContentText,
    contentJson: nextDocument,
    featuredImageId: existing.featuredImageId,
    featuredImageAlt: input.featuredImageAlt,
    status: nextStatus,
    scheduledAt: nextScheduledAt
  });

  if (nextStatus !== PostStatus.DRAFT && nextStatus !== PostStatus.ARCHIVED && Object.keys(publishErrors).length) {
    return fail("PUBLISH_VALIDATION", "Complete the publishing checklist.", 422, publishErrors);
  }

  const wasImmediatelyPublic = existing.status === PostStatus.PUBLISHED || existing.status === PostStatus.UNLISTED;
  const isImmediatelyPublic = nextStatus === PostStatus.PUBLISHED || nextStatus === PostStatus.UNLISTED;
  const publicationDate = isImmediatelyPublic ? existing.publishedAt ?? new Date() : null;
  const firstPublicationDate = existing.firstPublishedAt ?? (isImmediatelyPublic ? publicationDate : nextScheduledAt);
  const nextRevisionNumber = existing.revisionNumber + 1;
  const shouldCreateRevision = Boolean(parsed.data.createRevision) || (!wasImmediatelyPublic && isImmediatelyPublic);

  const post = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.post.update({
      where: { id, revisionNumber: existing.revisionNumber },
      data: {
        title: input.title,
        titleVi: input.titleVi?.trim() || null,
        slug: nextSlug,
        excerpt: input.excerpt?.trim() || null,
        excerptVi: input.excerptVi?.trim() || null,
        content: nextContentText,
        contentVi: input.contentVi?.trim() || null,
        ...(nextDocument ? { contentJson: nextDocument as Prisma.InputJsonValue } : {}),
        ...(input.contentJsonVi ? { contentJsonVi: input.contentJsonVi as Prisma.InputJsonValue } : {}),
        contentText: nextContentText,
        tagNames: input.tagNames,
        featuredImageAlt: input.featuredImageAlt?.trim() || null,
        seoTitle: input.seoTitle?.trim() || null,
        seoDescription: input.seoDescription?.trim() || null,
        canonicalUrl: input.canonicalUrl?.trim() || null,
        status: nextStatus,
        scheduledAt: nextScheduledAt,
        publishedAt: publicationDate,
        firstPublishedAt: firstPublicationDate,
        revisionNumber: nextRevisionNumber,
        authorId: existing.authorId ?? user.id
      },
      include: { author: { select: { displayName: true, username: true } } }
    });

    if (shouldCreateRevision) {
      const englishDocument = nextDocument ?? legacyArticleToDocument(nextContentText);
      await transaction.postRevision.create({
        data: {
          postId: id,
          locale: "en",
          revisionNumber: nextRevisionNumber,
          title: input.title,
          excerpt: input.excerpt?.trim() || null,
          contentJson: englishDocument as Prisma.InputJsonValue,
          createdById: user.id
        }
      });

      if (input.contentJsonVi) {
        await transaction.postRevision.create({
          data: {
            postId: id,
            locale: "vi",
            revisionNumber: nextRevisionNumber,
            title: input.titleVi?.trim() || input.title,
            excerpt: input.excerptVi?.trim() || null,
            contentJson: input.contentJsonVi as Prisma.InputJsonValue,
            createdById: user.id
          }
        });
      }
    }

    return updated;
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return null;
    }
    throw error;
  });

  if (!post) {
    return fail(
      "EDIT_CONFLICT",
      "This article was changed in another tab. Reload before saving again.",
      409
    );
  }

  revalidatePostPaths(existing.slug);
  revalidatePostPaths(post.slug);
  return ok(post);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Post not found.", 404);

  await prisma.post.delete({ where: { id } });
  await prisma.mediaAsset.deleteMany({ where: { filename: { startsWith: `posts/${id}/` } } });
  await deleteEntityImageFolder("posts", id);
  revalidatePostPaths(existing.slug);

  return ok({ deleted: true });
}

function revalidatePostPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/posts");
}
