import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductTableActions } from "@/components/admin/ProductTableActions";
import { prisma } from "@/lib/db";

async function getProducts() {
  try {
    return await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Products</h1>
        <Link className="button" href="/admin/products/new">
          New
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Images</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.slug}>
                <td>
                  {product.imageId ? (
                    <div className="table-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/media/${product.imageId}`} alt="" />
                    </div>
                  ) : (
                    "None"
                  )}
                </td>
                <td>{product.name}</td>
                <td>{product.slug}</td>
                <td>
                  <span className="badge">{product.status}</span>
                </td>
                <td>{getGalleryIds(product.gallery).length}</td>
                <td>
                  <ProductTableActions
                    id={product.id}
                    slug={product.slug}
                    title={product.name}
                    status={product.status}
                  />
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={6}>No products yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function getGalleryIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
