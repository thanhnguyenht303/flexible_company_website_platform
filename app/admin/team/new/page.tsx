import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NewTeamMemberPage() {
  const { t } = await getServerTranslations();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.newEmployee")}</h1>
        <Link className="button secondary" href="/admin/team">
          {t("admin.common.back")}
        </Link>
      </div>
      <TeamMemberForm />
    </AdminShell>
  );
}
