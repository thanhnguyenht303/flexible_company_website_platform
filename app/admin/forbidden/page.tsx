import { AdminShell } from "@/components/admin/AdminShell";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function ForbiddenPage() {
  const { t } = await getServerTranslations();
  return (
    <AdminShell>
      <div className="admin-panel forbidden-panel">
        <p className="badge badge--danger">403</p>
        <h1>{t("admin.access.forbidden")}</h1>
        <p>{t("admin.access.denied")}</p>
      </div>
    </AdminShell>
  );
}
