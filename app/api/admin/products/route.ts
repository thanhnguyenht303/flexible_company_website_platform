import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { normalizeProductInput, productSchema } from "@/modules/products/products.validation";

export async function GET() {
  const user = await requireAdminUser();
  if (!hasPermission(user, "products.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return ok(products);
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "products.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const { fields, images } = await parseProductRequest(request);
  const parsed = productSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const input = normalizeProductInput(parsed.data);
  const existing = await prisma.product.findUnique({ where: { slug: input.slug } });

  if (existing) {
    return fail("SLUG_EXISTS", "A product with this slug already exists.", 409, {
      slug: "Slug must be unique."
    });
  }

  let product = await prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      summary: input.summary || null,
      description: input.description || null,
      status: input.status as PublishStatus,
      gallery: []
    }
  });

  const imageIds = await saveProductImages(product.id, product.name, images, user.id);

  if (imageIds.length) {
    product = await prisma.product.update({
      where: { id: product.id },
      data: {
        imageId: imageIds[0],
        gallery: imageIds
      }
    });
  }

  revalidateProductPaths(product.slug);
  return ok(product, { status: 201 });
}

async function parseProductRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return {
      fields: {
        name: stringField(formData.get("name")),
        slug: stringField(formData.get("slug")),
        summary: stringField(formData.get("summary")),
        description: stringField(formData.get("description")),
        status: stringField(formData.get("status")) || "DRAFT"
      },
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

function stringField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function revalidateProductPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
}
