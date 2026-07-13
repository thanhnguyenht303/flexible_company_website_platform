import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { requireEmailAdmin } from "@/modules/email/email.admin";
import { emailTemplateSchema } from "@/modules/email/email.validation";
import { getTemplateVariables } from "@/modules/email/email.variables";

export async function GET(request: Request) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const templates = await prisma.emailTemplate.findMany({
    where: {
      ...(url.searchParams.get("category") ? { category: url.searchParams.get("category")! } : {}),
      ...(url.searchParams.get("active") === "true" ? { isActive: true } : {})
    },
    orderBy: [{ category: "asc" }, { name: "asc" }]
  });
  return ok(templates);
}

export async function POST(request: Request) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const parsed = emailTemplateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const duplicate = await prisma.emailTemplate.findUnique({ where: { key_language: { key: parsed.data.key, language: parsed.data.language } } });
  if (duplicate) return fail("DUPLICATE_TEMPLATE", "That template key and language already exist.", 409);
  return ok(await prisma.emailTemplate.create({ data: { ...parsed.data, variables: [...getTemplateVariables(parsed.data.category).map((item) => item.key), ...parsed.data.customVariables.map((item) => item.key)], customVariables: parsed.data.customVariables } }), { status: 201 });
}
