import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { blogPostSchema, normalizeBlogPostInput } from "@/modules/blog/blog.validation";

export async function listPublishedPosts() {
  return prisma.post.findMany({
    where: { status: PublishStatus.PUBLISHED },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function savePost(input: unknown) {
  const parsed = normalizeBlogPostInput(blogPostSchema.parse(input));

  return prisma.post.upsert({
    where: { slug: parsed.slug },
    update: parsed,
    create: {
      ...parsed,
      content: parsed.content,
      tagNames: [],
      publishedAt: parsed.status === "PUBLISHED" ? new Date() : null
    }
  });
}
