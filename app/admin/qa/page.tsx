import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { badgeTone, formatDate, statusLabel } from "@/modules/forms/forms.labels";

export const dynamic = "force-dynamic";

export default async function AdminQaPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string }> }) {
  const [{ language, t }, params] = await Promise.all([getServerTranslations(), searchParams]);
  const [items, categories] = await Promise.all([
    prisma.qaItem.findMany({
    where: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: "insensitive" } },
              { question: { contains: params.q, mode: "insensitive" } },
              { answer: { contains: params.q, mode: "insensitive" } },
              { category: { contains: params.q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    take: 500
    }),
    prisma.qaItem.findMany({ where: { category: { not: null } }, distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } })
  ]);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <div>
          <h1>{t("formsFeature.qa.title")}</h1>
          <p className="message">{t("formsFeature.qa.adminDescription")}</p>
        </div>
        <Link className="button" href="/admin/qa/new">
          {t("formsFeature.qa.newQa")}
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
            {["NEW", "REVIEWING", "ANSWERED", "PUBLISHED", "ARCHIVED", "SPAM"].map((status) => (
              <option value={status} key={status}>{statusLabel(language, status)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">{t("formsFeature.common.category")}</label>
          <select id="category" name="category" defaultValue={params.category ?? ""}>
            <option value="">{t("formsFeature.common.all")}</option>
            {categories.map((item) => item.category ? <option value={item.category} key={item.category}>{item.category}</option> : null)}
          </select>
        </div>
        <div className="form-actions">
          <button className="button" type="submit">{t("formsFeature.common.filter")}</button>
          <Link className="button secondary" href="/admin/qa">{t("formsFeature.common.reset")}</Link>
        </div>
      </form>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("formsFeature.qa.questionTitle")}</th>
              <th>{t("formsFeature.qa.submitter")}</th>
              <th>{t("formsFeature.common.category")}</th>
              <th>{t("formsFeature.common.status")}</th>
              <th>{t("formsFeature.common.created")}</th>
              <th>{t("formsFeature.common.publicPage")}</th>
              <th>{t("formsFeature.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.submitterName || item.submitterEmail || t("formsFeature.common.unknown")}</td>
                <td>{item.category || t("formsFeature.common.none")}</td>
                <td><span className={`badge badge--${badgeTone(item.status)}`}>{statusLabel(language, item.status)}</span></td>
                <td>{formatDate(item.createdAt, language)}</td>
                <td>{item.publishedAt ? formatDate(item.publishedAt, language) : t("formsFeature.common.none")}</td>
                <td>
                  <div className="row-actions">
                    {item.status === "PUBLISHED" ? <Link className="button secondary" href={`/qa/${item.slug}`}>{t("formsFeature.common.view")}</Link> : null}
                    <Link className="button" href={`/admin/qa/${item.id}`}>{t("formsFeature.common.edit")}</Link>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <strong>{t("formsFeature.qa.emptyTitle")}</strong>
                    <span>{t("formsFeature.qa.emptyText")}</span>
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
