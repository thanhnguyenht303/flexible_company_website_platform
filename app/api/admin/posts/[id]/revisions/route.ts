import { fail, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const revisions = await prisma.postRevision.findMany({
    where: { postId: id },
    select: {
      id: true,
      locale: true,
      revisionNumber: true,
      title: true,
      excerpt: true,
      createdAt: true,
      createdBy: { select: { displayName: true, username: true } }
    },
    orderBy: [{ createdAt: "desc" }],
    take: 50
  });

  return ok(revisions);
}
