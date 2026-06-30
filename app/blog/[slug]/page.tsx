import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { ArticleContent } from "@/components/shared/ArticleContent";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await isPublicPageVisible("blog"))) notFound();

  const { posts } = await getPublicSiteContext();
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();
  const publishedAt = "publishedAt" in post ? post.publishedAt : null;

  return (
    <PublicShell>
      <article className="article-page">
        <header className="article-header">
          <div className="article-kicker">Article</div>
          <h1>{post.title}</h1>
          {post.excerpt ? <p className="article-deck">{post.excerpt}</p> : null}
          <div className="article-meta">
            <span>{publishedAt ? formatArticleDate(publishedAt) : "Draft preview"}</span>
            <span>{getReadingTime(post.content)} min read</span>
          </div>
        </header>
        {"featuredImageId" in post && post.featuredImageId ? (
          <figure className="article-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${post.featuredImageId}`} alt="" />
          </figure>
        ) : null}
        <div className="article-content-wrap">
          <ArticleContent content={post.content} />
        </div>
      </article>
    </PublicShell>
  );
}

function getReadingTime(content: string) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
}

function formatArticleDate(date: Date | string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}
