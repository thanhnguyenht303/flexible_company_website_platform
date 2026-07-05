import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { DynamicForm } from "@/components/public/DynamicForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { formatDate } from "@/modules/forms/forms.labels";
import { getPublicFormBySlug } from "@/modules/forms/forms.service";

export const dynamic = "force-dynamic";

export default async function QaIndexPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const [{ language, t }, params] = await Promise.all([getServerTranslations(), searchParams]);
  const [items, askForm, categories] = await Promise.all([
    prisma.qaItem.findMany({
      where: {
        status: "PUBLISHED",
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
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 100
    }),
    getPublicFormBySlug("ask-a-question"),
    prisma.qaItem.findMany({
      where: { status: "PUBLISHED", category: { not: null } },
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true }
    })
  ]);

  return (
    <PublicShell pageSlug="qa">
      <main className="public-section qa-page">
        <div className="section-heading">
          <div>
            <p className="article-kicker">Questions & Answers</p>
            <h1>{t("formsFeature.qa.publicTitle")}</h1>
            <p>{t("formsFeature.qa.publicIntro")}</p>
          </div>
          <a className="button" href="#ask-question">{t("formsFeature.qa.askQuestion")}</a>
        </div>
        <form className="qa-search" action="/qa">
          <div className="field">
            <label htmlFor="q">{t("formsFeature.common.search")}</label>
            <input id="q" name="q" defaultValue={params.q ?? ""} />
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
            <Link className="button secondary" href="/qa">{t("formsFeature.common.reset")}</Link>
          </div>
        </form>
        <div className="qa-layout">
          <section className="qa-list">
            {items.map((item) => (
              <Link className="card qa-card" href={`/qa/${item.slug}`} key={item.id}>
                {item.category ? <span className="badge">{item.category}</span> : null}
                <h2>{item.title}</h2>
                <p>{item.answer || item.question}</p>
                <small>{formatDate(item.publishedAt ?? item.createdAt, language)}</small>
              </Link>
            ))}
            {!items.length ? (
              <div className="empty-state">
                <strong>{t("formsFeature.qa.emptyTitle")}</strong>
                <span>{t("formsFeature.qa.emptyText")}</span>
              </div>
            ) : null}
          </section>
          {askForm ? (
            <aside className="qa-ask-panel" id="ask-question">
              <DynamicForm form={askForm} titleOverride={t("formsFeature.qa.askQuestion")} submitLabel={t("formsFeature.qa.submitQuestion")} sourceType="qa" />
            </aside>
          ) : null}
        </div>
      </main>
    </PublicShell>
  );
}
