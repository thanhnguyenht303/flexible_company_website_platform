import { ThemeSettingsForm } from "@/components/admin/SettingsForms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AdminThemeSettingsPage() {
  const { theme } = await getPublicSiteContext();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Theme</h1>
      </div>
      <ThemeSettingsForm theme={theme} />
    </AdminShell>
  );
}
