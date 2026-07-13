import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { requireEmailAdmin } from "@/modules/email/email.admin";
import { emailTemplateSchema } from "@/modules/email/email.validation";
import { getTemplateVariables } from "@/modules/email/email.variables";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const template = await prisma.emailTemplate.findUnique({ where: { id: (await params).id } });
  return template ? ok(template) : fail("NOT_FOUND", "Email template not found.", 404);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const parsed = emailTemplateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Email template not found.", 404);
  const duplicate = await prisma.emailTemplate.findUnique({ where: { key_language: { key: parsed.data.key, language: parsed.data.language } } });
  if (duplicate && duplicate.id !== id) return fail("DUPLICATE_TEMPLATE", "That template key and language already exist.", 409);
  return ok(await prisma.emailTemplate.update({ where: { id }, data: { ...parsed.data, variables: [...getTemplateVariables(parsed.data.category).map((item) => item.key), ...parsed.data.customVariables.map((item) => item.key)], customVariables: parsed.data.customVariables } }));
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Email template not found.", 404);
  await prisma.emailTemplate.delete({ where: { id } });
  return ok({ deleted: true });
}
