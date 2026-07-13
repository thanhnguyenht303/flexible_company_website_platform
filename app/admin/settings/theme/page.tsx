import { ThemeSettingsForm } from "@/components/admin/SettingsForms";
import { NavbarThemeSettingsForm } from "@/components/admin/NavbarThemeSettingsForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { getNavbarThemeFromSite } from "@/lib/navbar-theme";
import { getPublicSiteContext } from "@/lib/public-data";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function AdminThemeSettingsPage() {
  const [{ theme, site }, { t }] = await Promise.all([getPublicSiteContext(), getServerTranslations()]);
  const navbarTheme = getNavbarThemeFromSite(site);

  return (
    <AdminShell requiredAuthority="theme.manage">
      <div className="admin-page-header">
        <h1>{t("admin.common.theme")}</h1>
      </div>
      <NavbarThemeSettingsForm theme={navbarTheme} />
      <ThemeSettingsForm theme={theme} />
    </AdminShell>
  );
}
