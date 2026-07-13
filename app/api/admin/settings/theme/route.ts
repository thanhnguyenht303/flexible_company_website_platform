import { revalidatePath } from "next/cache";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { deleteStoredImage, saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { themeSettingsSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "theme.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Theme upload");
  if (oversized) return oversized;

  const { fields, backgroundImage, removeBackgroundImage } = await parseThemeSettingsRequest(request);
  const parsed = themeSettingsSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const existing = await prisma.themeSetting.findFirst();
  let backgroundImageId = existing?.backgroundImageId ?? null;

  if (removeBackgroundImage || backgroundImage) {
    if (backgroundImageId) {
      const existingImage = await prisma.mediaAsset.findUnique({ where: { id: backgroundImageId } });
      if (existingImage?.filename.startsWith("theme-backgrounds/site/")) {
        await deleteStoredImage(existingImage.filename).catch(() => null);
      }
      await prisma.mediaAsset.delete({ where: { id: backgroundImageId } }).catch(() => null);
    }
    backgroundImageId = backgroundImage ? await saveThemeBackground(backgroundImage, user.id) : null;
  }

  const data = {
    ...parsed.data,
    backgroundImageId
  };
  const theme = existing
    ? await prisma.themeSetting.update({ where: { id: existing.id }, data })
    : await prisma.themeSetting.create({ data });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/theme");
  return ok(theme);
}

async function parseThemeSettingsRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const imageValue = formData.get("backgroundImage");

    return {
      fields: {
        primaryColor: stringField(formData.get("primaryColor")),
        secondaryColor: stringField(formData.get("secondaryColor")),
        accentColor: stringField(formData.get("accentColor")),
        backgroundColor: stringField(formData.get("backgroundColor")),
        textColor: stringField(formData.get("textColor")),
        fontFamily: stringField(formData.get("fontFamily")),
        borderRadius: stringField(formData.get("borderRadius")),
        headerLayout: stringField(formData.get("headerLayout")),
        footerLayout: stringField(formData.get("footerLayout")),
        customCss: stringField(formData.get("customCss"))
      },
      backgroundImage: imageValue instanceof File && imageValue.size > 0 ? imageValue : null,
      removeBackgroundImage: stringField(formData.get("removeBackgroundImage")) === "true"
    };
  }

  const fields = await request.json().catch(() => null);

  return {
    fields,
    backgroundImage: null,
    removeBackgroundImage:
      typeof fields === "object" &&
      fields !== null &&
      "removeBackgroundImage" in fields &&
      (fields as { removeBackgroundImage?: unknown }).removeBackgroundImage === true
  };
}

async function saveThemeBackground(backgroundImage: File, userId: string) {
  const savedImage = await saveEntityImage({ entityType: "theme-backgrounds", entityId: "site", file: backgroundImage });
  if (!savedImage) throw new Error("Background image could not be saved.");

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: savedImage.relativePath,
      originalName: savedImage.originalName,
      mimeType: savedImage.mimeType,
      sizeBytes: savedImage.sizeBytes,
      url: "/api/media/pending",
      altText: "Site theme background",
      uploadedById: userId
    }
  });

  await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { url: `/api/media/${asset.id}` }
  });

  return asset.id;
}

function stringField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
