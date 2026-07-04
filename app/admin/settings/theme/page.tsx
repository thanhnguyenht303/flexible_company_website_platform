import { ThemeSettingsForm } from "@/components/admin/SettingsForms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSiteContext } from "@/lib/public-data";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function AdminThemeSettingsPage() {
  const [{ theme }, { t }] = await Promise.all([getPublicSiteContext(), getServerTranslations()]);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.common.theme")}</h1>
      </div>
      <ThemeSettingsForm theme={theme} />
    </AdminShell>
  );
}
