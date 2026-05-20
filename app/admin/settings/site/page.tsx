import { SiteSettingsForm } from "@/components/admin/SettingsForms";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AdminSiteSettingsPage() {
  const { site } = await getPublicSiteContext();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Site Settings</h1>
      </div>
      <SiteSettingsForm site={site} />
    </AdminShell>
  );
}
