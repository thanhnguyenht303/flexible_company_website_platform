import { revalidatePath } from "next/cache";
import { PostStatus, Prisma } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import { articleDocumentToText } from "@/modules/blog/article-document";
import {
  blogDraftSchema,
  normalizeBlogPostInput,
  validatePublishablePost
} from "@/modules/blog/blog.validation";

export async function GET() {
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const posts = await prisma.post.findMany({
    include: { author: { select: { displayName: true, username: true } } },
    orderBy: [{ updatedAt: "desc" }],
    take: 100
  });

  return ok(posts);
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const body = await request.json().catch(() => null);
  const parsed = blogDraftSchema.safeParse(body);
  if (!parsed.success) return validationFail(parsed.error);

  const input = normalizeBlogPostInput(parsed.data);
  if (parsed.data.contentJson != null && !input.contentJson) {
    return fail("INVALID_DOCUMENT", "The article document contains unsupported content.", 422, {
      contentJson: "The article document could not be saved."
    });
  }

  const status = (input.status ?? "DRAFT") as PostStatus;
  const publishErrors = validatePublishablePost({
    title: input.title,
    content: input.content,
    contentJson: input.contentJson,
    featuredImageAlt: input.featuredImageAlt,
    status,
    scheduledAt: input.scheduledAt
  });

  if (status !== PostStatus.DRAFT && status !== PostStatus.ARCHIVED && Object.keys(publishErrors).length) {
    return fail("PUBLISH_VALIDATION", "Complete the publishing checklist.", 422, publishErrors);
  }

  const slug = await createUniqueSlug(input.slug || input.title || "untitled-story");
  const contentText = articleDocumentToText(input.contentJson) || input.content;
  const now = new Date();
  const isImmediatelyPublic = status === PostStatus.PUBLISHED || status === PostStatus.UNLISTED;
  const scheduledAt = status === PostStatus.SCHEDULED && input.scheduledAt ? new Date(input.scheduledAt) : null;

  const post = await prisma.post.create({
    data: {
      title: input.title,
      titleVi: input.titleVi?.trim() || null,
      slug,
      excerpt: input.excerpt?.trim() || null,
      excerptVi: input.excerptVi?.trim() || null,
      content: contentText,
      contentVi: input.contentVi?.trim() || null,
      ...(input.contentJson ? { contentJson: input.contentJson as Prisma.InputJsonValue } : {}),
      ...(input.contentJsonVi ? { contentJsonVi: input.contentJsonVi as Prisma.InputJsonValue } : {}),
      contentText,
      status,
      tagNames: input.tagNames,
      featuredImageAlt: input.featuredImageAlt?.trim() || null,
      seoTitle: input.seoTitle?.trim() || null,
      seoDescription: input.seoDescription?.trim() || null,
      canonicalUrl: input.canonicalUrl?.trim() || null,
      scheduledAt,
      publishedAt: isImmediatelyPublic ? now : null,
      firstPublishedAt: isImmediatelyPublic ? now : scheduledAt,
      authorId: user.id
    },
    include: { author: { select: { displayName: true, username: true } } }
  });

  revalidatePostPaths(post.slug);
  return ok(post, { status: 201 });
}

async function createUniqueSlug(value: string) {
  const base = slugify(value) || "untitled-story";
  let candidate = base;
  let suffix = 2;

  while (await prisma.post.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function revalidatePostPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/posts");
}
