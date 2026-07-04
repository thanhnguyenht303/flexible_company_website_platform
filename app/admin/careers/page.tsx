import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobPostingTableActions } from "@/components/admin/JobPostingTableActions";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

async function getJobs() {
  try {
    return await prisma.jobPosting.findMany({
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });
  } catch {
    return [];
  }
}

export default async function AdminCareersPage() {
  const [jobs, { t }] = await Promise.all([getJobs(), getServerTranslations()]);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.common.careers")}</h1>
        <Link className="button" href="/admin/careers/new">
          {t("admin.common.new")}
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.common.title")}</th>
              <th>{t("admin.common.department")}</th>
              <th>{t("admin.common.location")}</th>
              <th>{t("admin.common.status")}</th>
              <th>{t("admin.common.applications")}</th>
              <th>{t("admin.common.published")}</th>
              <th>{t("admin.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.department}</td>
                <td>{job.location}</td>
                <td>
                  <span className="badge">{t(`admin.status.${job.status}`)}</span>
                </td>
                <td>
                  <Link href={`/admin/careers/${job.id}/applications`}>
                    {job._count.applications}{" "}
                    {job._count.applications === 1
                      ? t("admin.common.applicationSingular")
                      : t("admin.common.applicationPlural")}
                  </Link>
                </td>
                <td>{job.publishedAt ? job.publishedAt.toLocaleDateString() : t("admin.common.notPublished")}</td>
                <td>
                  <JobPostingTableActions id={job.id} slug={job.slug} title={job.title} status={job.status} />
                </td>
              </tr>
            ))}
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={7}>{t("admin.empty.jobs")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
