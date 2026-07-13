import { revalidatePath } from "next/cache";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { deleteStoredImage, saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { siteSettingsSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "siteSettings.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Site settings upload");
  if (oversized) return oversized;

  const { fields, logo } = await parseSiteSettingsRequest(request);
  const parsed = siteSettingsSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const existing = await prisma.siteSetting.findFirst();
  let logoId = existing?.logoId ?? null;

  if (logo) {
    if (logoId) {
      const existingLogo = await prisma.mediaAsset.findUnique({ where: { id: logoId } });
      if (existingLogo?.filename.startsWith("logos/site/")) {
        await deleteStoredImage(existingLogo.filename).catch(() => null);
      }
      await prisma.mediaAsset.delete({ where: { id: logoId } }).catch(() => null);
    }
    logoId = await saveSiteLogo(logo, parsed.data.siteName, user.id);
  }

  const data = {
    ...parsed.data,
    email: parsed.data.email || null,
    mapEmbedUrl: parsed.data.mapEmbedUrl || null,
    logoId
  };
  const site = existing
    ? await prisma.siteSetting.update({ where: { id: existing.id }, data })
    : await prisma.siteSetting.create({ data });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/site");
  return ok(site);
}

async function parseSiteSettingsRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const logoValue = formData.get("logo");

    return {
      fields: {
        siteName: stringField(formData.get("siteName")),
        tagline: stringField(formData.get("tagline")),
        description: stringField(formData.get("description")),
        email: stringField(formData.get("email")),
        phone: stringField(formData.get("phone")),
        address: stringField(formData.get("address")),
        domain: stringField(formData.get("domain")),
        mapEmbedUrl: stringField(formData.get("mapEmbedUrl"))
      },
      logo: logoValue instanceof File && logoValue.size > 0 ? logoValue : null
    };
  }

  return {
    fields: await request.json().catch(() => null),
    logo: null
  };
}

async function saveSiteLogo(logo: File, siteName: string, userId: string) {
  const savedImage = await saveEntityImage({ entityType: "logos", entityId: "site", file: logo });
  if (!savedImage) throw new Error("Logo could not be saved.");

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: savedImage.relativePath,
      originalName: savedImage.originalName,
      mimeType: savedImage.mimeType,
      sizeBytes: savedImage.sizeBytes,
      url: "/api/media/pending",
      altText: `${siteName} logo`,
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
