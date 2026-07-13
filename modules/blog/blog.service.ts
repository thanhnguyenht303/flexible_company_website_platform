import { PostStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { blogPostSchema, normalizeBlogPostInput } from "@/modules/blog/blog.validation";

export async function listPublishedPosts() {
  const now = new Date();
  return prisma.post.findMany({
    where: {
      OR: [
        { status: PostStatus.PUBLISHED },
        { status: PostStatus.SCHEDULED, scheduledAt: { lte: now } }
      ]
    },
    include: { author: { select: { displayName: true, username: true } } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function getPublicPostBySlug(slug: string) {
  const now = new Date();
  return prisma.post.findFirst({
    where: {
      slug,
      OR: [
        { status: PostStatus.PUBLISHED },
        { status: PostStatus.UNLISTED },
        { status: PostStatus.SCHEDULED, scheduledAt: { lte: now } }
      ]
    },
    include: { author: { select: { displayName: true, username: true } } }
  });
}

export async function savePost(input: unknown) {
  const parsed = normalizeBlogPostInput(blogPostSchema.parse(input));
  const now = new Date();
  const status = parsed.status as PostStatus;
  const data = {
    title: parsed.title,
    titleVi: parsed.titleVi?.trim() || null,
    slug: parsed.slug,
    excerpt: parsed.excerpt?.trim() || null,
    excerptVi: parsed.excerptVi?.trim() || null,
    content: parsed.content,
    contentVi: parsed.contentVi?.trim() || null,
    ...(parsed.contentJson ? { contentJson: parsed.contentJson as Prisma.InputJsonValue } : {}),
    ...(parsed.contentJsonVi ? { contentJsonVi: parsed.contentJsonVi as Prisma.InputJsonValue } : {}),
    contentText: parsed.content,
    tagNames: parsed.tagNames,
    featuredImageAlt: parsed.featuredImageAlt?.trim() || null,
    seoTitle: parsed.seoTitle?.trim() || null,
    seoDescription: parsed.seoDescription?.trim() || null,
    canonicalUrl: parsed.canonicalUrl?.trim() || null,
    status
  };

  return prisma.post.upsert({
    where: { slug: parsed.slug },
    update: data,
    create: {
      ...data,
      publishedAt: status === PostStatus.PUBLISHED ? now : null,
      firstPublishedAt: status === PostStatus.PUBLISHED ? now : null
    }
  });
}
