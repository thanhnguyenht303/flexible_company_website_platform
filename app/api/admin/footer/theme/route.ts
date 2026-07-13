import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultFooterTheme } from "@/lib/footer-theme";
import { hasPermission } from "@/lib/permissions";

const footerThemeSchema = z.object({
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
});

export async function PUT(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "footer.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const fields = await request.json().catch(() => null);
  const parsed = footerThemeSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const existing = await prisma.siteSetting.findFirst();
  const currentSeo = getObject(existing?.defaultSeo);
  const defaultSeo = {
    ...currentSeo,
    footerTheme: {
      ...defaultFooterTheme,
      ...parsed.data
    }
  };

  const site = existing
    ? await prisma.siteSetting.update({ where: { id: existing.id }, data: { defaultSeo } })
    : await prisma.siteSetting.create({ data: { defaultSeo } });

  revalidatePath("/", "layout");
  revalidatePath("/admin/footer");

  return ok(site);
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
