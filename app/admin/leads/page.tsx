import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { badgeTone, formatDate, priorityLabel, statusLabel } from "@/modules/forms/forms.labels";
import { leadPriorities, leadStatuses } from "@/modules/forms/forms.types";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; formId?: string }>;
}) {
  const [{ language, t }, params] = await Promise.all([getServerTranslations(), searchParams]);
  const [leads, forms] = await Promise.all([
    prisma.lead.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.priority ? { priority: params.priority } : {}),
        ...(params.formId ? { sourceFormId: params.formId } : {}),
        ...(params.q
          ? {
              OR: [
                { name: { contains: params.q, mode: "insensitive" } },
                { email: { contains: params.q, mode: "insensitive" } },
                { phone: { contains: params.q, mode: "insensitive" } },
                { companyName: { contains: params.q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: { createdAt: "desc" },
      take: 500
    }),
    prisma.form.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => Boolean(value)) as Array<[string, string]>);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <div>
          <h1>{t("formsFeature.leads.title")}</h1>
          <p className="message">{t("formsFeature.leads.description")}</p>
        </div>
        <Link className="button secondary" href={`/api/admin/leads?${query.toString()}${query.size ? "&" : ""}format=csv`}>
          {t("formsFeature.common.exportCsv")}
        </Link>
      </div>
      <form className="admin-panel feature-filter-bar feature-filter-bar--wide">
        <div className="field">
          <label htmlFor="q">{t("formsFeature.common.search")}</label>
          <input id="q" name="q" defaultValue={params.q ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="status">{t("formsFeature.common.status")}</label>
          <select id="status" name="status" defaultValue={params.status ?? ""}>
            <option value="">{t("formsFeature.common.all")}</option>
            {leadStatuses.map((status) => (
              <option value={status} key={status}>{statusLabel(language, status)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="priority">{t("formsFeature.leads.priority")}</label>
          <select id="priority" name="priority" defaultValue={params.priority ?? ""}>
            <option value="">{t("formsFeature.common.all")}</option>
            {leadPriorities.map((priority) => (
              <option value={priority} key={priority}>{priorityLabel(language, priority)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="formId">{t("formsFeature.forms.title")}</label>
          <select id="formId" name="formId" defaultValue={params.formId ?? ""}>
            <option value="">{t("formsFeature.common.all")}</option>
            {forms.map((form) => (
              <option value={form.id} key={form.id}>{form.name}</option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button className="button" type="submit">{t("formsFeature.common.filter")}</button>
          <Link className="button secondary" href="/admin/leads">{t("formsFeature.common.reset")}</Link>
        </div>
      </form>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("formsFeature.common.created")}</th>
              <th>{t("common.name")}</th>
              <th>{t("formsFeature.leads.email")}</th>
              <th>{t("formsFeature.leads.phone")}</th>
              <th>{t("formsFeature.leads.company")}</th>
              <th>{t("formsFeature.common.status")}</th>
              <th>{t("formsFeature.leads.priority")}</th>
              <th>{t("formsFeature.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{formatDate(lead.createdAt, language)}</td>
                <td>{lead.name || t("formsFeature.common.unknown")}</td>
                <td>{lead.email || t("formsFeature.common.none")}</td>
                <td>{lead.phone || t("formsFeature.common.none")}</td>
                <td>{lead.companyName || t("formsFeature.common.none")}</td>
                <td><span className={`badge badge--${badgeTone(lead.status)}`}>{statusLabel(language, lead.status)}</span></td>
                <td><span className={`badge badge--${badgeTone(lead.priority)}`}>{priorityLabel(language, lead.priority)}</span></td>
                <td><Link className="button secondary" href={`/admin/leads/${lead.id}`}>{t("formsFeature.common.open")}</Link></td>
              </tr>
            ))}
            {!leads.length ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <strong>{t("formsFeature.leads.emptyTitle")}</strong>
                    <span>{t("formsFeature.leads.emptyText")}</span>
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
