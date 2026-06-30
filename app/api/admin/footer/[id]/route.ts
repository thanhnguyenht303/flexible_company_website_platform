import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { deleteEntityImageFolder, deleteStoredImage, saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { footerPartnerSchema } from "@/modules/footer/footer.validation";

const updateFooterPartnerSchema = footerPartnerSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required."
});

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "footer.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const partner = await prisma.footerPartner.findUnique({ where: { id } });
  if (!partner) return fail("NOT_FOUND", "Footer collaborator not found.", 404);

  return ok(partner);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "footer.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.footerPartner.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Footer collaborator not found.", 404);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Logo upload");
  if (oversized) return oversized;

  const { fields, logo } = await parseFooterPartnerRequest(request);
  const parsed = updateFooterPartnerSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  let logoId = existing.logoId;

  if (logo) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: existing.logoId } });
    if (asset?.filename.startsWith(`logos/${id}/`)) {
      await deleteStoredImage(asset.filename);
    }
    await prisma.mediaAsset.delete({ where: { id: existing.logoId } }).catch(() => null);
    logoId = await savePartnerLogo(id, parsed.data.name ?? existing.name, logo, user.id);
  }

  const partner = await prisma.footerPartner.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.websiteUrl !== undefined ? { websiteUrl: parsed.data.websiteUrl || null } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.isVisible !== undefined ? { isVisible: parsed.data.isVisible } : {}),
      ...(logo ? { logoId } : {})
    }
  });

  revalidateFooterPaths();
  return ok(partner);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "footer.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.footerPartner.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Footer collaborator not found.", 404);

  await prisma.footerPartner.delete({ where: { id } });
  await prisma.mediaAsset.deleteMany({
    where: {
      filename: {
        startsWith: `logos/${id}/`
      }
    }
  });
  await deleteEntityImageFolder("logos", id);

  revalidateFooterPaths();
  return ok({ deleted: true });
}

async function parseFooterPartnerRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const logoValue = formData.get("logo");
    const fields: Record<string, string> = {};

    for (const field of ["name", "websiteUrl", "sortOrder", "isVisible"]) {
      const value = formData.get(field);
      if (typeof value === "string") fields[field] = value;
    }

    return {
      fields,
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

function revalidateFooterPaths() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/footer");
}
