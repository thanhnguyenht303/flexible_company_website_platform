import { SiteSettingsForm } from "@/components/admin/SettingsForms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSiteContext } from "@/lib/public-data";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function AdminSiteSettingsPage() {
  const [{ site }, { t }] = await Promise.all([getPublicSiteContext(), getServerTranslations()]);

  return (
    <AdminShell requiredAuthority="siteSettings.manage">
      <div className="admin-page-header">
        <h1>{t("admin.common.siteSettings")}</h1>
      </div>
      <SiteSettingsForm site={site} />
    </AdminShell>
  );
}
