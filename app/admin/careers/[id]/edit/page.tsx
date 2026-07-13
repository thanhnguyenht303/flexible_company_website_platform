import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobPostingForm } from "@/components/admin/JobPostingForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

async function getJob(id: string) {
  try {
    return await prisma.jobPosting.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function EditJobPostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, { t }] = await Promise.all([getJob(id), getServerTranslations()]);
  if (!job) notFound();

  return (
    <AdminShell requiredAuthority="careers.manage">
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.editJob")}</h1>
        <Link className="button secondary" href="/admin/careers">
          {t("admin.common.back")}
        </Link>
      </div>
      <JobPostingForm job={job} />
    </AdminShell>
  );
}
