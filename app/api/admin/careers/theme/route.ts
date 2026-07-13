import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { defaultCareerTheme } from "@/lib/career-theme";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { deleteSectionThemeBackground, saveSectionThemeBackground } from "@/lib/section-theme-image";

const careerThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
});

export async function PUT(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "careers.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Career theme upload");
  if (oversized) return oversized;

  const { fields, backgroundImage, removeBackgroundImage } = await parseThemeRequest(request);
  const parsed = careerThemeSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const existing = await prisma.siteSetting.findFirst();
  const currentSeo = getObject(existing?.defaultSeo);
  const currentTheme = getObject(currentSeo.careerTheme);
  let backgroundImageId = stringValue(currentTheme.backgroundImageId);

  if (removeBackgroundImage || backgroundImage) {
    await deleteSectionThemeBackground(backgroundImageId, "careers");
    backgroundImageId = backgroundImage
      ? await saveSectionThemeBackground({
          file: backgroundImage,
          section: "careers",
          userId: user.id,
          altText: "Career theme background"
        })
      : null;
  }

  const defaultSeo = {
    ...currentSeo,
    careerTheme: {
      ...defaultCareerTheme,
      ...parsed.data,
      backgroundImageId
    }
  };

  const site = existing
    ? await prisma.siteSetting.update({ where: { id: existing.id }, data: { defaultSeo } })
    : await prisma.siteSetting.create({ data: { defaultSeo } });

  revalidatePath("/careers");
  revalidatePath("/careers", "layout");
  revalidatePath("/admin/careers");

  return ok(site);
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function parseThemeRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const imageValue = formData.get("backgroundImage");

    return {
      fields: {
        primaryColor: stringField(formData.get("primaryColor")),
        accentColor: stringField(formData.get("accentColor")),
        backgroundColor: stringField(formData.get("backgroundColor")),
        textColor: stringField(formData.get("textColor"))
      },
      backgroundImage: imageValue instanceof File && imageValue.size > 0 ? imageValue : null,
      removeBackgroundImage: stringField(formData.get("removeBackgroundImage")) === "true"
    };
  }

  return {
    fields: await request.json().catch(() => null),
    backgroundImage: null,
    removeBackgroundImage: false
  };
}

function stringField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}
