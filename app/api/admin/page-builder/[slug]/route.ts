import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { isBuilderBlockAllowedForPage, isSupportedBuilderPageSlug } from "@/modules/page-builder/page-builder.policy";
import { pageBuilderSaveSchema } from "@/modules/page-builder/page-builder.validation";

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "pages.manage")) return fail("FORBIDDEN", "Forbidden.", 403);
  if (!isSupportedBuilderPageSlug(slug)) return fail("NOT_FOUND", "This page cannot use the visual builder.", 404);

  const parsed = pageBuilderSaveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const disallowedBlock = parsed.data.blocks.find((block) => !isBuilderBlockAllowedForPage(slug, block));
  if (disallowedBlock) return fail("BLOCK_NOT_ALLOWED", `${disallowedBlock.type} blocks are not allowed on this page.`, 422);

  if (parsed.data.status === "DRAFT") {
    await prisma.pageBuilderDraft.upsert({
      where: { pageSlug: slug },
      update: {
        title: parsed.data.title,
        blocks: parsed.data.blocks
      },
      create: {
        pageSlug: slug,
        title: parsed.data.title,
        blocks: parsed.data.blocks
      }
    });

    revalidatePath(`/admin/page-builder/${slug}`);
    return ok({ slug, status: "DRAFT" });
  }

  const page = await prisma.page.upsert({
    where: { slug },
    update: {
      title: parsed.data.title,
      status: parsed.data.status as PublishStatus,
      template: "visual-builder"
    },
    create: {
      title: parsed.data.title,
      slug,
      status: parsed.data.status as PublishStatus,
      template: "visual-builder"
    }
  });

  await prisma.$transaction([
    prisma.pageSection.deleteMany({
      where: {
        pageId: page.id,
        type: {
          startsWith: "builder_"
        }
      }
    }),
    prisma.pageSection.createMany({
      data: parsed.data.blocks.map((block, index) => ({
        pageId: page.id,
        type: `builder_${block.type}`,
        enabled: block.enabled,
        sortOrder: index + 1,
        title: block.title ?? null,
        subtitle: block.subtitle ?? null,
        settings: block
      }))
    })
  ]);

  await prisma.pageBuilderDraft.delete({ where: { pageSlug: slug } }).catch(() => null);

  revalidatePath("/", "layout");
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/page-builder/${slug}`);
  if (slug === "home") revalidatePath("/");
  else revalidatePath(`/${slug}`);

  return ok({ slug: page.slug, status: parsed.data.status });
}
