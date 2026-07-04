import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

async function getJobWithApplications(id: string) {
  return prisma.jobPosting.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          resumeFile: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}

export default async function JobApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, { t }] = await Promise.all([getJobWithApplications(id), getServerTranslations()]);
  if (!job) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <div>
          <h1>{t("admin.pageTitles.applications")}</h1>
          <p className="message">
            {t("admin.pages.applicationsSummary", {
              title: job.title,
              count: job.applications.length,
              label:
                job.applications.length === 1
                  ? t("admin.common.applicationSingular")
                  : t("admin.common.applicationPlural")
            })}
          </p>
        </div>
        <Link className="button secondary" href="/admin/careers">
          {t("admin.common.back")}
        </Link>
      </div>

      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.common.applicant")}</th>
              <th>{t("admin.common.contact")}</th>
              <th>{t("admin.common.company")}</th>
              <th>{t("admin.common.submitted")}</th>
              <th>{t("admin.common.resume")}</th>
              <th>{t("admin.common.note")}</th>
            </tr>
          </thead>
          <tbody>
            {job.applications.map((application) => (
              <tr key={application.id}>
                <td>
                  <strong>{application.name}</strong>
                  <div className="message">{t(`admin.status.${application.status}`)}</div>
                </td>
                <td>
                  <a href={`mailto:${application.email}`}>{application.email}</a>
                  {application.phone ? <div>{application.phone}</div> : null}
                </td>
                <td>{application.companyName || t("admin.common.notProvided")}</td>
                <td>{application.createdAt.toLocaleString()}</td>
                <td>
                  {application.resumeFile ? (
                    <a className="button secondary" href={application.resumeFile.url} target="_blank" rel="noreferrer">
                      {t("admin.common.viewResume")}
                    </a>
                  ) : (
                    t("admin.common.missingFile")
                  )}
                </td>
                <td>{application.message || t("admin.common.noNote")}</td>
              </tr>
            ))}
            {job.applications.length === 0 ? (
              <tr>
                <td colSpan={6}>{t("admin.empty.applications")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
