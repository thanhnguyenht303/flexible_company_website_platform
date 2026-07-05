import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { normalizeQaInput, updateQaItemSchema } from "@/modules/forms/forms.validation";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "qa.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const item = await prisma.qaItem.findUnique({ where: { id } });
  if (!item) return fail("NOT_FOUND", "Q&A item not found.", 404);

  const [lead, submission, form] = await Promise.all([
    item.leadId ? prisma.lead.findUnique({ where: { id: item.leadId } }) : null,
    item.submissionId ? prisma.formSubmission.findUnique({ where: { id: item.submissionId } }) : null,
    item.sourceFormId ? prisma.form.findUnique({ where: { id: item.sourceFormId }, select: { id: true, name: true, slug: true } }) : null
  ]);

  return ok({ item, lead, submission, form });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "qa.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.qaItem.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Q&A item not found.", 404);

  const parsed = updateQaItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const input = normalizeQaInput(parsed.data);
  let nextSlug = input.slug;
  if (nextSlug && nextSlug !== existing.slug) {
    nextSlug = await getUniqueQaSlug(nextSlug, id);
  }

  const nextStatus = input.status ?? existing.status;
  const shouldPublish = nextStatus === "PUBLISHED" && !existing.publishedAt;
  const shouldUnpublish = nextStatus !== "PUBLISHED";

  const item = await prisma.qaItem.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.question !== undefined ? { question: input.question } : {}),
      ...(input.answer !== undefined ? { answer: input.answer || null } : {}),
      ...(input.submitterName !== undefined ? { submitterName: input.submitterName || null } : {}),
      ...(input.submitterEmail !== undefined ? { submitterEmail: input.submitterEmail || null } : {}),
      ...(input.category !== undefined ? { category: input.category || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.relatedType !== undefined ? { relatedType: input.relatedType || null } : {}),
      ...(input.relatedId !== undefined ? { relatedId: input.relatedId || null } : {}),
      ...(shouldPublish ? { publishedAt: new Date() } : {}),
      ...(shouldUnpublish ? { publishedAt: null } : {})
    }
  });

  return ok(item);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "qa.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.qaItem.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Q&A item not found.", 404);

  await prisma.qaItem.delete({ where: { id } });
  return ok({ deleted: true });
}

async function getUniqueQaSlug(base: string, currentId: string) {
  let slug = base;
  let suffix = 2;
  while (true) {
    const owner = await prisma.qaItem.findUnique({ where: { slug } });
    if (!owner || owner.id === currentId) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}
