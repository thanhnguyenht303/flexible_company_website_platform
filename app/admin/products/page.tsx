import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductTableActions } from "@/components/admin/ProductTableActions";
import { prisma } from "@/lib/db";
import { localizedField } from "@/lib/i18n/content";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

async function getProducts() {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
}

export default async function AdminProductsPage() {
  const [products, { language, t }] = await Promise.all([getProducts(), getServerTranslations()]);

  return (
    <AdminShell requiredAuthority="products.manage">
      <div className="admin-page-header">
        <h1>{t("admin.common.products")}</h1>
        <Link className="button" href="/admin/products/new">
          {t("admin.common.new")}
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("admin.common.image")}</th>
              <th scope="col">{t("admin.common.name")}</th>
              <th scope="col">{t("admin.common.slug")}</th>
              <th scope="col">{t("admin.common.status")}</th>
              <th scope="col">{t("admin.common.images")}</th>
              <th scope="col">{t("admin.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const name = localizedField(product, "name", language);
              return (
                <tr key={product.slug}>
                  <td>
                    {product.imageId ? (
                      <div className="table-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/media/${product.imageId}`} alt="" />
                      </div>
                    ) : (
                      t("admin.common.none")
                    )}
                  </td>
                  <td>{name}</td>
                  <td>{product.slug}</td>
                  <td>
                    <span className="badge">{t(`admin.status.${product.status}`)}</span>
                  </td>
                  <td>{getGalleryIds(product.gallery).length}</td>
                  <td>
                    <ProductTableActions id={product.id} slug={product.slug} title={name} status={product.status} />
                  </td>
                </tr>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td colSpan={6}>{t("admin.empty.products")}</td>
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
