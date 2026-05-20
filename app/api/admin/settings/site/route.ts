import { revalidatePath } from "next/cache";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { siteSettingsSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "site.settings.update")) return fail("FORBIDDEN", "Forbidden.", 403);

  const parsed = siteSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const existing = await prisma.siteSetting.findFirst();
  const data = {
    ...parsed.data,
    email: parsed.data.email || null,
    mapEmbedUrl: parsed.data.mapEmbedUrl || null
  };
  const site = existing
    ? await prisma.siteSetting.update({ where: { id: existing.id }, data })
    : await prisma.siteSetting.create({ data });

  revalidatePath("/", "layout");
  return ok(site);
}
