import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobPostingForm } from "@/components/admin/JobPostingForm";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NewJobPostingPage() {
  const { t } = await getServerTranslations();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.newJob")}</h1>
        <Link className="button secondary" href="/admin/careers">
          {t("admin.common.back")}
        </Link>
      </div>
      <JobPostingForm />
    </AdminShell>
  );
}
