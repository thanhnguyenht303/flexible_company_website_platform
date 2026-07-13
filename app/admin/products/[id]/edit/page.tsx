import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return null;

    const imageIds = getGalleryIds(product.gallery);
    const images = imageIds.length
      ? await prisma.mediaAsset.findMany({
          where: { id: { in: imageIds } },
          orderBy: { createdAt: "asc" }
        })
      : [];

    return { product, images };
  } catch {
    return null;
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, { t }] = await Promise.all([getProduct(id), getServerTranslations()]);
  if (!data) notFound();

  return (
    <AdminShell requiredAuthority="products.manage">
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.editProduct")}</h1>
        <Link className="button secondary" href="/admin/products">
          {t("admin.common.back")}
        </Link>
      </div>
      <ProductForm
        product={{
          id: data.product.id,
          name: data.product.name,
          nameVi: data.product.nameVi,
          slug: data.product.slug,
          summary: data.product.summary,
          summaryVi: data.product.summaryVi,
          description: data.product.description,
          descriptionVi: data.product.descriptionVi,
          status: data.product.status,
          imageId: data.product.imageId
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
