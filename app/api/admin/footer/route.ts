import { revalidatePath } from "next/cache";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { footerPartnerSchema } from "@/modules/footer/footer.validation";

export async function GET() {
  const user = await requireAdminUser();
  if (!hasPermission(user, "footer.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const partners = await prisma.footerPartner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });

  return ok(partners);
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "footer.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Logo upload");
  if (oversized) return oversized;

  const { fields, logo } = await parseFooterPartnerRequest(request);
  const parsed = footerPartnerSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);
  if (!logo) return fail("LOGO_REQUIRED", "A collaborator logo is required.", 422, { logo: "Logo is required." });

  let partner = await prisma.footerPartner.create({
    data: {
      name: parsed.data.name,
      logoId: "pending",
      websiteUrl: parsed.data.websiteUrl || null,
      sortOrder: parsed.data.sortOrder,
      isVisible: parsed.data.isVisible
    }
  });

  const logoId = await savePartnerLogo(partner.id, partner.name, logo, user.id);
  partner = await prisma.footerPartner.update({
    where: { id: partner.id },
    data: { logoId }
  });

  revalidateFooterPaths();
  return ok(partner, { status: 201 });
}

async function parseFooterPartnerRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const logoValue = formData.get("logo");

    return {
      fields: {
        name: stringField(formData.get("name")),
        websiteUrl: stringField(formData.get("websiteUrl")),
        sortOrder: stringField(formData.get("sortOrder")) || "0",
        isVisible: stringField(formData.get("isVisible")) || "true"
      },
      logo: logoValue instanceof File && logoValue.size > 0 ? logoValue : null
    };
  }

  return {
    fields: await request.json().catch(() => null),
    logo: null
  };
}

async function savePartnerLogo(partnerId: string, partnerName: string, logo: File, userId: string) {
  const savedImage = await saveEntityImage({ entityType: "logos", entityId: partnerId, file: logo });
  if (!savedImage) throw new Error("Logo could not be saved.");

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: savedImage.relativePath,
      originalName: savedImage.originalName,
      mimeType: savedImage.mimeType,
      sizeBytes: savedImage.sizeBytes,
      url: "/api/media/pending",
      altText: `${partnerName} logo`,
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

function revalidateFooterPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/footer");
}
