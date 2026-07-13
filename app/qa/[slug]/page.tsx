import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { getQaThemeFromSite, getQaThemeStyle } from "@/lib/qa-theme";
import { formatDate } from "@/modules/forms/forms.labels";

export const dynamic = "force-dynamic";

export default async function QaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ language, t }, item, site] = await Promise.all([
    getServerTranslations(),
    prisma.qaItem.findFirst({ where: { slug, status: "PUBLISHED" } }),
    prisma.siteSetting.findFirst({ select: { defaultSeo: true } })
  ]);
  if (!item) notFound();
  const qaTheme = getQaThemeFromSite(site ?? {});
  const related = await prisma.qaItem.findMany({
    where: { status: "PUBLISHED", category: item.category, id: { not: item.id } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 3
  });
  const publishedDate = formatDate(item.publishedAt ?? item.createdAt, language);

  return (
    <PublicShell pageSlug="qa">
      <article className="public-section article-detail qa-detail" style={getQaThemeStyle(qaTheme)}>
        <nav className="qa-breadcrumb" aria-label={t("formsFeature.qa.breadcrumbLabel")}>
          <Link href="/qa">{t("formsFeature.qa.publicTitle")}</Link>
          {item.category ? (
            <>
              <span aria-hidden="true">/</span>
              <Link href={`/qa?category=${encodeURIComponent(item.category)}`}>{item.category}</Link>
            </>
          ) : null}
        </nav>
        <header className="qa-detail__hero">
          <div className="qa-detail__meta">
            {item.category ? <span className="badge">{item.category}</span> : null}
            <span>{t("formsFeature.qa.updatedLabel")} {publishedDate}</span>
          </div>
          <h1>{item.title}</h1>
          <p>{item.question}</p>
        </header>
        <div className="qa-detail__body">
          <section className="qa-answer-panel" aria-labelledby="qa-answer-title">
            <p className="article-kicker">{t("formsFeature.qa.officialAnswer")}</p>
            <h2 id="qa-answer-title">{t("formsFeature.qa.answer")}</h2>
            {item.answer ? <p>{item.answer}</p> : <p className="message">{t("formsFeature.qa.answerPending")}</p>}
          </section>
          <aside className="qa-help-card" aria-labelledby="qa-help-title">
            <p className="article-kicker">{t("formsFeature.qa.stillNeedHelp")}</p>
            <h2 id="qa-help-title">{t("formsFeature.qa.askAnother")}</h2>
            <p>{t("formsFeature.qa.askPanelText")}</p>
            <Link className="button" href="/qa#ask-question">{t("formsFeature.qa.askQuestion")}</Link>
          </aside>
        </div>
        {related.length ? (
          <section className="qa-related" aria-labelledby="qa-related-title">
            <div className="qa-section-head">
              <div>
                <p className="article-kicker">{t("formsFeature.qa.relatedAnswers")}</p>
                <h2 id="qa-related-title">{t("formsFeature.qa.publicTitle")}</h2>
              </div>
              <Link className="button secondary" href="/qa">{t("formsFeature.qa.viewAllAnswers")}</Link>
            </div>
            <div className="qa-list qa-list--embedded">
              {related.map((relatedItem) => (
                <Link className="card qa-card" href={`/qa/${relatedItem.slug}`} key={relatedItem.id}>
                  <span className="qa-card__meta">
                    {relatedItem.category ? <span className="badge">{relatedItem.category}</span> : null}
                    <small>{t("formsFeature.qa.updatedLabel")} {formatDate(relatedItem.publishedAt ?? relatedItem.createdAt, language)}</small>
                  </span>
                  <h3>{relatedItem.title}</h3>
                  <p>{relatedItem.answer || relatedItem.question}</p>
                  <span className="qa-card__action">{t("formsFeature.qa.viewAnswer")}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </PublicShell>
  );
}
