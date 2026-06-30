import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { deleteEntityImageFolder, deleteStoredImage, saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { slugify } from "@/lib/slug";

const updateServiceSchema = z
  .object({
    name: z.string().min(2).max(180).optional(),
    slug: z.string().max(220).optional(),
    summary: z.string().max(320).optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.nativeEnum(PublishStatus).optional(),
    removeImageIds: z.array(z.string()).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
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
  if (!hasPermission(user, "services.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return fail("NOT_FOUND", "Service not found.", 404);

  return ok(service);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "services.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Service not found.", 404);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Service upload");
  if (oversized) return oversized;

  const { fields, images } = await parseServiceRequest(request);
  const parsed = updateServiceSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const input = parsed.data;
  const nextSlug =
    input.slug && input.slug.trim().length > 0
      ? slugify(input.slug)
      : input.name
        ? slugify(input.name)
        : undefined;

  if (nextSlug && nextSlug !== existing.slug) {
    const slugOwner = await prisma.service.findUnique({ where: { slug: nextSlug } });
    if (slugOwner) {
      return fail("SLUG_EXISTS", "A service with this slug already exists.", 409, {
        slug: "Slug must be unique."
      });
    }
  }

  const currentGallery = getGalleryIds(existing.gallery);
  const removeImageIds = new Set(input.removeImageIds ?? []);
  const removedAssets = removeImageIds.size
    ? await prisma.mediaAsset.findMany({ where: { id: { in: [...removeImageIds] } } })
    : [];

  for (const asset of removedAssets) {
    if (asset.filename.startsWith(`services/${id}/`)) {
      await deleteStoredImage(asset.filename);
    }
  }

  if (removeImageIds.size) {
    await prisma.mediaAsset.deleteMany({ where: { id: { in: [...removeImageIds] } } });
  }

  const retainedGallery = currentGallery.filter((id) => !removeImageIds.has(id));
  const newImageIds = await saveServiceImages(id, input.name ?? existing.name, images, user.id);
  const nextGallery = [...retainedGallery, ...newImageIds];

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.summary !== undefined ? { summary: input.summary || null } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      imageId: nextGallery[0] ?? null,
      gallery: nextGallery
    }
  });

  revalidateServicePaths(existing.slug);
  revalidateServicePaths(service.slug);

  return ok(service);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "services.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Service not found.", 404);

  await prisma.service.delete({ where: { id } });
  await prisma.mediaAsset.deleteMany({
    where: {
      filename: {
        startsWith: `services/${id}/`
      }
    }
  });
  await deleteEntityImageFolder("services", id);

  revalidateServicePaths(existing.slug);
  return ok({ deleted: true });
}

async function parseServiceRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const fields: Record<string, string | string[]> = {};

    for (const field of ["name", "slug", "summary", "description", "status"]) {
      const value = formData.get(field);
      if (typeof value === "string") fields[field] = value;
    }

    fields.removeImageIds = formData
      .getAll("removeImageIds")
      .filter((value): value is string => typeof value === "string");

    return {
      fields,
      images: formData
        .getAll("images")
        .filter((value): value is File => value instanceof File && value.size > 0)
    };
  }

  return {
    fields: await request.json().catch(() => null),
    images: []
  };
}

async function saveServiceImages(serviceId: string, serviceName: string, images: File[], userId: string) {
  const imageIds: string[] = [];

  for (const image of images) {
    const savedImage = await saveEntityImage({ entityType: "services", entityId: serviceId, file: image });
    if (!savedImage) continue;

    const asset = await prisma.mediaAsset.create({
      data: {
        filename: savedImage.relativePath,
        originalName: savedImage.originalName,
        mimeType: savedImage.mimeType,
        sizeBytes: savedImage.sizeBytes,
        url: "/api/media/pending",
        altText: serviceName,
        uploadedById: userId
      }
    });

    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { url: `/api/media/${asset.id}` }
    });

    imageIds.push(asset.id);
  }

  return imageIds;
}

function getGalleryIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function revalidateServicePaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath(`/services/${slug}`);
  revalidatePath("/admin/services");
}
