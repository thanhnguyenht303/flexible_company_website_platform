import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

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
  const [data, { t }] = await Promise.all([getService(id), getServerTranslations()]);
  if (!data) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.editService")}</h1>
        <Link className="button secondary" href="/admin/services">
          {t("admin.common.back")}
        </Link>
      </div>
      <ServiceForm
        service={{
          id: data.service.id,
          name: data.service.name,
          nameVi: data.service.nameVi,
          slug: data.service.slug,
          summary: data.service.summary,
          summaryVi: data.service.summaryVi,
          description: data.service.description,
          descriptionVi: data.service.descriptionVi,
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
