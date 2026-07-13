import { AdminShell } from "@/components/admin/AdminShell";
import { PageVisibilitySettings } from "@/components/admin/PageVisibilitySettings";
import Link from "next/link";
import { getPublicPageVisibility } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function AdminPagesPage() {
  const [{ sections }, pages, { t }] = await Promise.all([
    getPublicSiteContext(),
    getPublicPageVisibility(),
    getServerTranslations()
  ]);

  return (
    <AdminShell requiredAuthority="pages.manage">
      <div className="admin-page-header">
        <h1>{t("admin.common.pages")}</h1>
      </div>
      <PageVisibilitySettings pages={pages} />
      <div className="admin-panel">
        <h2>{t("admin.pages.visualBuilder")}</h2>
        <p className="message">{t("admin.pages.visualBuilderDescription")}</p>
        <div className="form-actions">
          <Link className="button" href="/admin/page-builder/home">
            {t("admin.common.editHomepage")}
          </Link>
          <Link className="button secondary" href="/">
            {t("admin.common.viewHomepage")}
          </Link>
          <Link className="button" href="/admin/page-builder/about">
            {t("admin.common.editAboutPage")}
          </Link>
          <Link className="button secondary" href="/about">
            {t("admin.common.viewAboutPage")}
          </Link>
        </div>
      </div>
      <div className="admin-panel">
        <h2>{t("admin.pages.homepageSections")}</h2>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("admin.common.order")}</th>
              <th scope="col">{t("admin.common.type")}</th>
              <th scope="col">{t("admin.common.visible")}</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={`${section.type}-${section.sortOrder}`}>
                <td>{section.sortOrder}</td>
                <td>{section.type}</td>
                <td>
                  <span className="badge">{section.enabled ? t("admin.common.yes") : t("admin.common.no")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
