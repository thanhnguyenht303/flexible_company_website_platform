import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/db";

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
  const data = await getProduct(id);
  if (!data) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Edit Product</h1>
        <Link className="button secondary" href="/admin/products">
          Back
        </Link>
      </div>
      <ProductForm
        product={{
          id: data.product.id,
          name: data.product.name,
          slug: data.product.slug,
          summary: data.product.summary,
          description: data.product.description,
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
