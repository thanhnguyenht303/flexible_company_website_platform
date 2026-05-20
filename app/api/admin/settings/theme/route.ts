import { revalidatePath } from "next/cache";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { themeSettingsSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "theme.update")) return fail("FORBIDDEN", "Forbidden.", 403);

  const parsed = themeSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const existing = await prisma.themeSetting.findFirst();
  const theme = existing
    ? await prisma.themeSetting.update({ where: { id: existing.id }, data: parsed.data })
    : await prisma.themeSetting.create({ data: parsed.data });

  revalidatePath("/", "layout");
  return ok(theme);
}
