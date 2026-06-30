import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { normalizeServiceInput, serviceSchema } from "@/modules/services/services.validation";

export async function GET() {
  const user = await requireAdminUser();
  if (!hasPermission(user, "services.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const services = await prisma.service.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return ok(services);
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "services.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Service upload");
  if (oversized) return oversized;

  const { fields, images } = await parseServiceRequest(request);
  const parsed = serviceSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const input = normalizeServiceInput(parsed.data);
  const existing = await prisma.service.findUnique({ where: { slug: input.slug } });

  if (existing) {
    return fail("SLUG_EXISTS", "A service with this slug already exists.", 409, {
      slug: "Slug must be unique."
    });
  }

  let service = await prisma.service.create({
    data: {
      name: input.name,
      slug: input.slug,
      summary: input.summary || null,
      description: input.description || null,
      status: input.status as PublishStatus,
      gallery: []
    }
  });

  const imageIds = await saveServiceImages(service.id, service.name, images, user.id);

  if (imageIds.length) {
    service = await prisma.service.update({
      where: { id: service.id },
      data: {
        imageId: imageIds[0],
        gallery: imageIds
      }
    });
  }

  revalidateServicePaths(service.slug);
  return ok(service, { status: 201 });
}

async function parseServiceRequest(request: Request) {
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

function stringField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function revalidateServicePaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath(`/services/${slug}`);
  revalidatePath("/admin/services");
}
