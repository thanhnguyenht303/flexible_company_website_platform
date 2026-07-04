import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { localizePost } from "@/lib/i18n/content";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function BlogPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  if (!(await isPublicPageVisible("blog"))) notFound();

  const [{ posts }, language] = await Promise.all([getPublicSiteContext(), getCurrentLanguage()]);
  const localizedPosts = posts.map((post) => localizePost(post, language));
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = (resolvedSearchParams.q ?? "").trim();
  const visiblePosts = query
    ? localizedPosts.filter((post) => post.title.toLowerCase().includes(query.toLowerCase()))
    : localizedPosts;

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{translate(language, "pages.blog.title")}</h2>
              <p>{translate(language, "pages.blog.description")}</p>
            </div>
          </div>
          <form className="blog-search" action="/blog">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label={translate(language, "pages.blog.searchLabel")}
              defaultValue={query}
              name="q"
              placeholder={translate(language, "pages.blog.searchPlaceholder")}
              type="search"
            />
            <button className="button" type="submit">
              {translate(language, "common.search")}
            </button>
            {query ? (
              <Link className="button secondary" href="/blog">
                {translate(language, "common.clear")}
              </Link>
            ) : null}
          </form>
          <div className="blog-card-grid">
            {visiblePosts.map((post) => (
              <Link className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
                <span>{translate(language, "common.article")}</span>
                <h3>{post.title}</h3>
                <p>/{post.slug}</p>
                <small>
                  {getReadingTime(post.content)} {translate(language, "common.minRead")}
                </small>
              </Link>
            ))}
            {visiblePosts.length === 0 ? (
              <p className="message">
                {query ? translate(language, "pages.blog.emptySearch") : "No posts are published yet."}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function getReadingTime(content: string) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
}
