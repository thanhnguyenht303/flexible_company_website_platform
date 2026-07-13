import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { DynamicForm } from "@/components/public/DynamicForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { getQaThemeFromSite, getQaThemeStyle } from "@/lib/qa-theme";
import { formatDate } from "@/modules/forms/forms.labels";
import { getPublicFormBySlug } from "@/modules/forms/forms.service";

export const dynamic = "force-dynamic";

export default async function QaIndexPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const [{ language, t }, params] = await Promise.all([getServerTranslations(), searchParams]);
  const query = params.q?.trim() ?? "";
  const selectedCategory = params.category?.trim() ?? "";
  const hasActiveFilters = Boolean(query || selectedCategory);
  const [items, askForm, categoryItems, totalPublished, recentItems, site] = await Promise.all([
    prisma.qaItem.findMany({
      where: {
        status: "PUBLISHED",
        ...(selectedCategory ? { category: selectedCategory } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { question: { contains: query, mode: "insensitive" } },
                { answer: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } }
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
      orderBy: { category: "asc" },
      select: { category: true }
    }),
    prisma.qaItem.count({ where: { status: "PUBLISHED" } }),
    prisma.qaItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3
    }),
    prisma.siteSetting.findFirst({ select: { defaultSeo: true } })
  ]);
  const qaTheme = getQaThemeFromSite(site ?? {});
  const categoryCounts = categoryItems.reduce<Map<string, number>>((counts, item) => {
    if (!item.category) return counts;
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const categories = [...categoryCounts.entries()].map(([category, count]) => ({ category, count }));
  const featuredItems = hasActiveFilters ? [] : recentItems;
  const resultCopy = items.length === 1 ? t("formsFeature.qa.resultCountSingular") : t("formsFeature.qa.resultCountPlural", { count: items.length });
  const buildCategoryHref = (category?: string) => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    if (category) nextParams.set("category", category);
    const qs = nextParams.toString();
    return qs ? `/qa?${qs}` : "/qa";
  };

  return (
    <PublicShell pageSlug="qa">
      <main className="public-section qa-page" style={getQaThemeStyle(qaTheme)}>
        <section className="qa-hero" aria-labelledby="qa-title">
          <div className="qa-hero__copy">
            <p className="article-kicker">{t("formsFeature.qa.heroBadge")}</p>
            <h1 id="qa-title">{t("formsFeature.qa.publicTitle")}</h1>
            <p>{t("formsFeature.qa.publicIntro")}</p>
          </div>
          <form className="qa-search" action="/qa" role="search" aria-label={t("formsFeature.qa.searchLabel")}>
            <div className="field qa-search__query">
              <label htmlFor="q">{t("formsFeature.common.search")}</label>
              <input id="q" name="q" type="search" defaultValue={query} placeholder={t("formsFeature.qa.searchPlaceholder")} />
            </div>
            <div className="field qa-search__select">
              <label htmlFor="category">{t("formsFeature.common.category")}</label>
              <select id="category" name="category" defaultValue={selectedCategory}>
                <option value="">{t("formsFeature.common.all")}</option>
                {categories.map((item) => <option value={item.category} key={item.category}>{item.category}</option>)}
              </select>
            </div>
            <div className="form-actions qa-search__actions">
              <button className="button" type="submit">{t("formsFeature.common.filter")}</button>
              {hasActiveFilters ? <Link className="button secondary" href="/qa">{t("formsFeature.common.reset")}</Link> : null}
            </div>
          </form>
          <div className="qa-hero__stats" aria-label={t("formsFeature.qa.summaryLabel")}>
            <span><strong>{totalPublished}</strong>{t("formsFeature.qa.answeredStat")}</span>
            <span><strong>{categories.length}</strong>{t("formsFeature.qa.categoriesStat")}</span>
            {askForm ? <a href="#ask-question">{t("formsFeature.qa.askQuestion")}</a> : null}
          </div>
        </section>

        <section className="qa-category-strip" aria-labelledby="qa-categories-title">
          <div className="qa-section-head">
            <div>
              <p className="article-kicker">{t("formsFeature.qa.browseByCategory")}</p>
              <h2 id="qa-categories-title">{t("formsFeature.common.category")}</h2>
            </div>
          </div>
          <div className="qa-category-list">
            <Link className={`qa-category-chip${!selectedCategory ? " is-active" : ""}`} href={buildCategoryHref()} aria-current={!selectedCategory ? "page" : undefined}>
              {t("formsFeature.common.all")}
              <span>{totalPublished}</span>
            </Link>
            {categories.map((item) => (
              <Link
                className={`qa-category-chip${selectedCategory === item.category ? " is-active" : ""}`}
                href={buildCategoryHref(item.category)}
                key={item.category}
                aria-current={selectedCategory === item.category ? "page" : undefined}
              >
                {item.category}
                <span>{item.count}</span>
              </Link>
            ))}
          </div>
        </section>

        {featuredItems.length ? (
          <section className="qa-featured" aria-labelledby="qa-featured-title">
            <div className="qa-section-head">
              <div>
                <p className="article-kicker">{t("formsFeature.qa.popularQuestions")}</p>
                <h2 id="qa-featured-title">{t("formsFeature.qa.recentlyAnswered")}</h2>
              </div>
              <a className="button secondary" href="#qa-results">{t("formsFeature.qa.viewAllAnswers")}</a>
            </div>
            <div className="qa-list qa-list--featured">
              {featuredItems.map((item) => (
                <Link className="card qa-card qa-card--featured" href={`/qa/${item.slug}`} key={item.id}>
                  <span className="qa-card__meta">
                    {item.category ? <span className="badge">{item.category}</span> : null}
                    <small>{t("formsFeature.qa.updatedLabel")} {formatDate(item.publishedAt ?? item.createdAt, language)}</small>
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.answer || item.question}</p>
                  <span className="qa-card__action">{t("formsFeature.qa.viewAnswer")}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="qa-layout">
          <section className="qa-results" id="qa-results" aria-labelledby="qa-results-title">
            <div className="qa-section-head qa-results__head">
              <div>
                <p className="article-kicker">{t("formsFeature.qa.resultsLabel")}</p>
                <h2 id="qa-results-title">{resultCopy}</h2>
              </div>
              <p className="message" aria-live="polite">
                {query ? t("formsFeature.qa.showingSearch", { query }) : t("formsFeature.qa.showingAll")}
              </p>
            </div>
            <div className="qa-list">
              {items.map((item) => (
                <Link className="card qa-card" href={`/qa/${item.slug}`} key={item.id}>
                  <span className="qa-card__meta">
                    {item.category ? <span className="badge">{item.category}</span> : null}
                    <small>{t("formsFeature.qa.updatedLabel")} {formatDate(item.publishedAt ?? item.createdAt, language)}</small>
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.answer || item.question || t("formsFeature.qa.answerPreviewFallback")}</p>
                  <span className="qa-card__action">{t("formsFeature.qa.viewAnswer")}</span>
                </Link>
              ))}
              {!items.length ? (
                <div className="empty-state qa-empty-state">
                  <strong>{hasActiveFilters ? t("formsFeature.qa.noResultsTitle") : t("formsFeature.qa.emptyTitle")}</strong>
                  <span>{hasActiveFilters ? t("formsFeature.qa.noResultsText") : t("formsFeature.qa.emptyText")}</span>
                  <div className="form-actions">
                    {hasActiveFilters ? <Link className="button secondary" href="/qa">{t("formsFeature.qa.clearFilters")}</Link> : null}
                    {askForm ? <a className="button" href="#ask-question">{t("formsFeature.qa.askQuestion")}</a> : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
          {askForm ? (
            <aside className="qa-ask-panel" id="ask-question" aria-label={t("formsFeature.qa.askQuestion")}>
              <div className="qa-ask-panel__intro">
                <p className="article-kicker">{t("formsFeature.qa.stillNeedHelp")}</p>
                <p>{t("formsFeature.qa.askPanelText")}</p>
              </div>
              <DynamicForm form={askForm} titleOverride={t("formsFeature.qa.askQuestion")} submitLabel={t("formsFeature.qa.submitQuestion")} sourceType="qa" />
            </aside>
          ) : null}
        </div>
      </main>
    </PublicShell>
  );
}
