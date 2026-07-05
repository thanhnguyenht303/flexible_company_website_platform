import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { badgeTone, firstStringValue, formatDateTime, statusLabel, valueEntries } from "@/modules/forms/forms.labels";

export const dynamic = "force-dynamic";

export default async function FormSubmissionsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { id } = await params;
  const [{ language, t }, filters, form] = await Promise.all([
    getServerTranslations(),
    searchParams,
    prisma.form.findUnique({
    where: { id },
    include: { submissions: { orderBy: { createdAt: "desc" }, take: 500 } }
    })
  ]);
  if (!form) notFound();
  const submissions = form.submissions.filter((submission) => {
    if (filters.status && submission.status !== filters.status) return false;
    if (!filters.q) return true;
    return JSON.stringify(submission.values).toLowerCase().includes(filters.q.toLowerCase());
  });

  return (
    <AdminShell>
      <div className="admin-page-header">
        <div>
          <h1>{t("formsFeature.submissions.title", { name: form.name })}</h1>
          <p className="message">{t("formsFeature.submissions.recent", { count: submissions.length })}</p>
        </div>
        <div className="row-actions">
          <Link className="button secondary" href={`/api/admin/forms/${form.id}/submissions?format=csv`}>
            {t("formsFeature.common.exportCsv")}
          </Link>
          <Link className="button secondary" href="/admin/forms">
            {t("formsFeature.common.back")}
          </Link>
        </div>
      </div>
      <form className="admin-panel feature-filter-bar">
        <div className="field">
          <label htmlFor="q">{t("formsFeature.common.search")}</label>
          <input id="q" name="q" defaultValue={filters.q ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="status">{t("formsFeature.common.status")}</label>
          <select id="status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">{t("formsFeature.common.all")}</option>
            {["NEW", "REVIEWING", "RESOLVED", "SPAM", "ARCHIVED"].map((status) => (
              <option value={status} key={status}>{statusLabel(language, status)}</option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button className="button" type="submit">{t("formsFeature.common.filter")}</button>
          <Link className="button secondary" href={`/admin/forms/${form.id}/submissions`}>{t("formsFeature.common.reset")}</Link>
        </div>
      </form>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("formsFeature.submissions.submittedAt")}</th>
              <th>{t("formsFeature.submissions.submitter")}</th>
              <th>{t("formsFeature.common.status")}</th>
              <th>{t("formsFeature.submissions.linkedLead")}</th>
              <th>{t("formsFeature.submissions.values")}</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => {
              const submitter =
                firstStringValue(submission.values, ["name", "fullName", "email"]) || t("formsFeature.common.unknown");
              return (
                <tr key={submission.id}>
                  <td>{formatDateTime(submission.createdAt, language)}</td>
                  <td>{submitter}</td>
                  <td>
                    <span className={`badge badge--${badgeTone(submission.status)}`}>{statusLabel(language, submission.status)}</span>
                  </td>
                  <td>{submission.leadId ? <Link href={`/admin/leads/${submission.leadId}`}>{t("formsFeature.submissions.openLead")}</Link> : t("formsFeature.common.none")}</td>
                  <td>
                    <div className="value-list value-list--compact">
                      {valueEntries(submission.values).slice(0, 5).map((entry) => (
                        <div key={entry.key}>
                          <dt>{entry.label}</dt>
                          <dd>{entry.value}</dd>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!submissions.length ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <strong>{t("formsFeature.submissions.emptyTitle")}</strong>
                    <span>{t("formsFeature.submissions.emptyText")}</span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
