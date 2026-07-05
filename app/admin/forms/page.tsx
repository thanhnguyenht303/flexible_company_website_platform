import Link from "next/link";
import { PublishStatus } from "@prisma/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { badgeTone, formatDate, statusLabel } from "@/modules/forms/forms.labels";

export const dynamic = "force-dynamic";

export default async function AdminFormsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; sourceType?: string }>;
}) {
  const [{ language, t }, params] = await Promise.all([getServerTranslations(), searchParams]);
  const forms = await prisma.form.findMany({
    where: {
      ...(params.status ? { status: params.status as PublishStatus } : {}),
      ...(params.sourceType ? { sourceType: params.sourceType } : {}),
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" } },
              { slug: { contains: params.q, mode: "insensitive" } },
              { description: { contains: params.q, mode: "insensitive" } },
              { sourceType: { contains: params.q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { fields: true, submissions: true } } },
    take: 200
  });
  const sourceTypes = await prisma.form.findMany({
    distinct: ["sourceType"],
    orderBy: { sourceType: "asc" },
    select: { sourceType: true }
  });

  return (
    <AdminShell>
      <div className="admin-page-header">
        <div>
          <h1>{t("formsFeature.forms.title")}</h1>
          <p className="message">{t("formsFeature.forms.description")}</p>
        </div>
        <Link className="button" href="/admin/forms/new">
          {t("formsFeature.forms.newForm")}
        </Link>
      </div>
      <form className="admin-panel feature-filter-bar">
        <div className="field">
          <label htmlFor="q">{t("formsFeature.common.search")}</label>
          <input id="q" name="q" defaultValue={params.q ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="status">{t("formsFeature.common.status")}</label>
          <select id="status" name="status" defaultValue={params.status ?? ""}>
            <option value="">{t("formsFeature.common.all")}</option>
            {["DRAFT", "PUBLISHED", "ARCHIVED"].map((status) => (
              <option value={status} key={status}>{statusLabel(language, status)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sourceType">{t("formsFeature.common.sourceType")}</label>
          <select id="sourceType" name="sourceType" defaultValue={params.sourceType ?? ""}>
            <option value="">{t("formsFeature.common.all")}</option>
            {sourceTypes.map((item) => (
              <option value={item.sourceType} key={item.sourceType}>{item.sourceType}</option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button className="button" type="submit">{t("formsFeature.common.filter")}</button>
          <Link className="button secondary" href="/admin/forms">{t("formsFeature.common.reset")}</Link>
        </div>
      </form>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("formsFeature.forms.name")}</th>
              <th>{t("formsFeature.forms.slug")}</th>
              <th>{t("formsFeature.common.status")}</th>
              <th>{t("formsFeature.common.sourceType")}</th>
              <th>{t("formsFeature.forms.fields")}</th>
              <th>{t("formsFeature.forms.submissions")}</th>
              <th>{t("formsFeature.common.created")}</th>
              <th>{t("formsFeature.common.updated")}</th>
              <th>{t("formsFeature.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id}>
                <td>{form.name}</td>
                <td>{form.slug}</td>
                <td>
                  <span className={`badge badge--${badgeTone(form.status)}`}>{statusLabel(language, form.status)}</span>
                </td>
                <td><span className="badge badge--neutral">{form.sourceType}</span></td>
                <td>{form._count.fields}</td>
                <td>{form._count.submissions}</td>
                <td>{formatDate(form.createdAt, language)}</td>
                <td>{formatDate(form.updatedAt, language)}</td>
                <td>
                  <div className="row-actions">
                    <Link className="button secondary" href={`/forms/${form.slug}`}>
                      {t("formsFeature.common.open")}
                    </Link>
                    <Link className="button secondary" href={`/admin/forms/${form.id}/submissions`}>
                      {t("formsFeature.forms.submissions")}
                    </Link>
                    <Link className="button" href={`/admin/forms/${form.id}/edit`}>
                      {t("formsFeature.common.edit")}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!forms.length ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <strong>{t("formsFeature.forms.emptyTitle")}</strong>
                    <span>{t("formsFeature.forms.emptyText")}</span>
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
