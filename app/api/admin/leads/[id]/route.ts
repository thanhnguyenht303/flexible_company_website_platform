import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { leadUpdateSchema } from "@/modules/forms/forms.validation";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "leads.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return fail("NOT_FOUND", "Lead not found.", 404);

  const [submission, form, qaItem] = await Promise.all([
    lead.submissionId ? prisma.formSubmission.findUnique({ where: { id: lead.submissionId } }) : null,
    lead.sourceFormId ? prisma.form.findUnique({ where: { id: lead.sourceFormId }, select: { id: true, name: true, slug: true } }) : null,
    prisma.qaItem.findFirst({ where: { leadId: lead.id } })
  ]);

  return ok({ lead, submission, form, qaItem });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "leads.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const parsed = leadUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Lead not found.", 404);

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.assignedToId !== undefined ? { assignedToId: parsed.data.assignedToId || null } : {}),
      ...(parsed.data.internalNote !== undefined ? { internalNote: parsed.data.internalNote || null } : {}),
      ...(parsed.data.followUpAt !== undefined ? { followUpAt: parsed.data.followUpAt ? new Date(parsed.data.followUpAt) : null } : {})
    }
  });

  return ok(lead);
}
