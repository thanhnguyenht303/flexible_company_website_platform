import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NewServicePage() {
  const { t } = await getServerTranslations();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.newService")}</h1>
        <Link className="button secondary" href="/admin/services">
          {t("admin.common.back")}
        </Link>
      </div>
      <ServiceForm />
    </AdminShell>
  );
}
