import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NewProductPage() {
  const { t } = await getServerTranslations();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.newProduct")}</h1>
        <Link className="button secondary" href="/admin/products">
          {t("admin.common.back")}
        </Link>
      </div>
      <ProductForm />
    </AdminShell>
  );
}
