import Link from "next/link";
import { CareerThemeSettingsForm } from "@/components/admin/CareerThemeSettingsForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobPostingTableActions } from "@/components/admin/JobPostingTableActions";
import { getCareerThemeFromSite } from "@/lib/career-theme";
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
  const [jobs, site, { t }] = await Promise.all([
    getJobs(),
    prisma.siteSetting.findFirst({ select: { defaultSeo: true } }).catch(() => null),
    getServerTranslations()
  ]);
  const careerTheme = getCareerThemeFromSite(site ?? {});

  return (
    <AdminShell requiredAuthority="careers.manage">
      <div className="admin-page-header">
        <h1>{t("admin.common.careers")}</h1>
        <Link className="button" href="/admin/careers/new">
          {t("admin.common.new")}
        </Link>
      </div>
      <CareerThemeSettingsForm theme={careerTheme} />
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("admin.common.title")}</th>
              <th scope="col">{t("admin.common.department")}</th>
              <th scope="col">{t("admin.common.location")}</th>
              <th scope="col">{t("admin.common.status")}</th>
              <th scope="col">{t("admin.common.applications")}</th>
              <th scope="col">{t("admin.common.published")}</th>
              <th scope="col">{t("admin.common.actions")}</th>
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
