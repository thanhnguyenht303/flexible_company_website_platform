import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { submissionUpdateSchema } from "@/modules/forms/forms.validation";

type Params = {
  params: Promise<{ id: string; submissionId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id, submissionId } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "forms.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const submission = await prisma.formSubmission.findFirst({ where: { id: submissionId, formId: id } });
  if (!submission) return fail("NOT_FOUND", "Submission not found.", 404);
  return ok(submission);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, submissionId } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "forms.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const parsed = submissionUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const existing = await prisma.formSubmission.findFirst({ where: { id: submissionId, formId: id } });
  if (!existing) return fail("NOT_FOUND", "Submission not found.", 404);

  const submission = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: { status: parsed.data.status }
  });
  return ok(submission);
}
