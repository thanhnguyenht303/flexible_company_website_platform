import { AdminShell } from "@/components/admin/AdminShell";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function AdminMediaPage() {
  const { t } = await getServerTranslations();

  return (
    <AdminShell requiredAuthority="media.manage">
      <div className="admin-page-header">
        <h1>{t("admin.common.media")}</h1>
        <button className="button" type="button">
          {t("admin.common.upload")}
        </button>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("admin.common.filename")}</th>
              <th scope="col">{t("admin.common.type")}</th>
              <th scope="col">{t("admin.common.size")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>placeholder-logo.svg</td>
              <td>image/svg+xml</td>
              <td>{t("admin.common.builtIn")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
