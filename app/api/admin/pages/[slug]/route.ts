import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { z } from "zod";
import { getPublicPage } from "@/config/public-pages";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

const pageVisibilitySchema = z.object({
  visible: z.boolean()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "site.settings.update")) return fail("FORBIDDEN", "Forbidden.", 403);

  const pageConfig = getPublicPage(slug);
  if (!pageConfig) return fail("NOT_FOUND", "This public page is not configurable.", 404);

  const parsed = pageVisibilitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const page = await prisma.page.upsert({
    where: { slug: pageConfig.slug },
    update: {
      title: pageConfig.title,
      status: parsed.data.visible ? PublishStatus.PUBLISHED : PublishStatus.DRAFT
    },
    create: {
      title: pageConfig.title,
      slug: pageConfig.slug,
      status: parsed.data.visible ? PublishStatus.PUBLISHED : PublishStatus.DRAFT
    }
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/pages");
  revalidatePath(pageConfig.href);

  return ok(page);
}
