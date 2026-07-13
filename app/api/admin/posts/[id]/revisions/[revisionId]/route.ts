import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { articleDocumentToText, normalizeArticleDocument } from "@/modules/blog/article-document";

type Params = { params: Promise<{ id: string; revisionId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id, revisionId } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const [post, revision] = await Promise.all([
    prisma.post.findUnique({ where: { id } }),
    prisma.postRevision.findFirst({ where: { id: revisionId, postId: id } })
  ]);
  if (!post || !revision) return fail("NOT_FOUND", "Revision not found.", 404);

  const document = normalizeArticleDocument(revision.contentJson);
  if (!document) return fail("INVALID_REVISION", "This revision cannot be restored.", 422);
  const nextRevisionNumber = post.revisionNumber + 1;

  const updated = await prisma.$transaction(async (transaction) => {
    const restored = await transaction.post.update({
      where: { id },
      data: revision.locale === "vi"
        ? {
            titleVi: revision.title,
            excerptVi: revision.excerpt,
            contentJsonVi: document as Prisma.InputJsonValue,
            revisionNumber: nextRevisionNumber
          }
        : {
            title: revision.title,
            excerpt: revision.excerpt,
            contentJson: document as Prisma.InputJsonValue,
            content: articleDocumentToText(document),
            contentText: articleDocumentToText(document),
            revisionNumber: nextRevisionNumber
          }
    });

    await transaction.postRevision.create({
      data: {
        postId: id,
        locale: revision.locale,
        revisionNumber: nextRevisionNumber,
        title: revision.title,
        excerpt: revision.excerpt,
        contentJson: document as Prisma.InputJsonValue,
        createdById: user.id
      }
    });

    return restored;
  });

  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");
  revalidatePath("/admin/posts");
  return ok(updated);
}
