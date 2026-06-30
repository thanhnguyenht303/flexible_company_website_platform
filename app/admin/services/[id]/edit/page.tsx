import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { prisma } from "@/lib/db";

async function getService(id: string) {
  try {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return null;

    const imageIds = getGalleryIds(service.gallery);
    const images = imageIds.length
      ? await prisma.mediaAsset.findMany({
          where: { id: { in: imageIds } },
          orderBy: { createdAt: "asc" }
        })
      : [];

    return { service, images };
  } catch {
    return null;
  }
}

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getService(id);
  if (!data) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Edit Service</h1>
        <Link className="button secondary" href="/admin/services">
          Back
        </Link>
      </div>
      <ServiceForm
        service={{
          id: data.service.id,
          name: data.service.name,
          slug: data.service.slug,
          summary: data.service.summary,
          description: data.service.description,
          status: data.service.status,
          imageId: data.service.imageId
        }}
        images={data.images.map((image) => ({
          id: image.id,
          url: image.url,
          originalName: image.originalName
        }))}
      />
    </AdminShell>
  );
}

function getGalleryIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
