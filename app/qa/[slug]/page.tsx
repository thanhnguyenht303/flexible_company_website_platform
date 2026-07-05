import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { formatDate } from "@/modules/forms/forms.labels";

export const dynamic = "force-dynamic";

export default async function QaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ language, t }, item] = await Promise.all([
    getServerTranslations(),
    prisma.qaItem.findFirst({ where: { slug, status: "PUBLISHED" } })
  ]);
  if (!item) notFound();
  const related = await prisma.qaItem.findMany({
    where: { status: "PUBLISHED", category: item.category, id: { not: item.id } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 3
  });

  return (
    <PublicShell pageSlug="qa">
      <article className="public-section article-detail qa-detail">
        <Link className="button secondary" href="/qa">{t("formsFeature.qa.backToQa")}</Link>
        {item.category ? <p className="article-kicker">{item.category}</p> : null}
        <h1>{item.title}</h1>
        <p className="message">{formatDate(item.publishedAt ?? item.createdAt, language)}</p>
        <section className="admin-panel qa-question">
          <h2>{t("formsFeature.qa.question")}</h2>
          <p>{item.question}</p>
        </section>
        <section className="admin-panel qa-answer">
          <h2>{t("formsFeature.qa.officialAnswer")}</h2>
          {item.answer ? <p>{item.answer}</p> : <p className="message">{t("formsFeature.qa.answerPending")}</p>}
        </section>
        {related.length ? (
          <section className="qa-related">
            <h2>{t("formsFeature.qa.publicTitle")}</h2>
            <div className="qa-list qa-list--embedded">
              {related.map((relatedItem) => (
                <Link className="card qa-card" href={`/qa/${relatedItem.slug}`} key={relatedItem.id}>
                  <h3>{relatedItem.title}</h3>
                  <p>{relatedItem.answer || relatedItem.question}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <Link className="button" href="/qa#ask-question">{t("formsFeature.qa.askAnother")}</Link>
      </article>
    </PublicShell>
  );
}
