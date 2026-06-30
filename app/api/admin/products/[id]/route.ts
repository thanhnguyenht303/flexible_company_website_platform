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

const updateProductSchema = z
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
  if (!hasPermission(user, "products.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  return ok(product);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "products.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Product not found.", 404);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Product upload");
  if (oversized) return oversized;

  const { fields, images } = await parseProductRequest(request);
  const parsed = updateProductSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const input = parsed.data;
  const nextSlug =
    input.slug && input.slug.trim().length > 0
      ? slugify(input.slug)
      : input.name
        ? slugify(input.name)
        : undefined;

  if (nextSlug && nextSlug !== existing.slug) {
    const slugOwner = await prisma.product.findUnique({ where: { slug: nextSlug } });
    if (slugOwner) {
      return fail("SLUG_EXISTS", "A product with this slug already exists.", 409, {
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
    if (asset.filename.startsWith(`products/${id}/`)) {
      await deleteStoredImage(asset.filename);
    }
  }

  if (removeImageIds.size) {
    await prisma.mediaAsset.deleteMany({ where: { id: { in: [...removeImageIds] } } });
  }

  const retainedGallery = currentGallery.filter((id) => !removeImageIds.has(id));
  const newImageIds = await saveProductImages(id, input.name ?? existing.name, images, user.id);
  const nextGallery = [...retainedGallery, ...newImageIds];

  const product = await prisma.product.update({
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

  revalidateProductPaths(existing.slug);
  revalidateProductPaths(product.slug);

  return ok(product);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "products.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Product not found.", 404);

  await prisma.product.delete({ where: { id } });
  await prisma.mediaAsset.deleteMany({
    where: {
      filename: {
        startsWith: `products/${id}/`
      }
    }
  });
  await deleteEntityImageFolder("products", id);

  revalidateProductPaths(existing.slug);
  return ok({ deleted: true });
}

async function parseProductRequest(request: Request) {
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

async function saveProductImages(productId: string, productName: string, images: File[], userId: string) {
  const imageIds: string[] = [];

  for (const image of images) {
    const savedImage = await saveEntityImage({ entityType: "products", entityId: productId, file: image });
    if (!savedImage) continue;

    const asset = await prisma.mediaAsset.create({
      data: {
        filename: savedImage.relativePath,
        originalName: savedImage.originalName,
        mimeType: savedImage.mimeType,
        sizeBytes: savedImage.sizeBytes,
        url: "/api/media/pending",
        altText: productName,
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

function revalidateProductPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
}
