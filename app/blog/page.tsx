import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { localizePost } from "@/lib/i18n/content";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getArticleReadingTime, normalizeArticleDocument } from "@/modules/blog/article-document";
import { listPublishedPosts } from "@/modules/blog/blog.service";

const postsPerPage = 12;

type BlogSearchParams = { q?: string; page?: string };

export default async function BlogPage({ searchParams }: { searchParams?: Promise<BlogSearchParams> }) {
  if (!(await isPublicPageVisible("blog"))) notFound();

  const [posts, language, resolvedSearchParams] = await Promise.all([
    listPublishedPosts(),
    getCurrentLanguage(),
    searchParams ?? Promise.resolve({} as BlogSearchParams)
  ]);
  const query = (resolvedSearchParams.q ?? "").trim();
  const localizedPosts = posts.map((post) => localizePost(post, language));
  const filteredPosts = query
    ? localizedPosts.filter((post) => {
        const searchable = [post.title, post.excerpt, post.contentText, ...post.tagNames].filter(Boolean).join(" ").toLocaleLowerCase();
        return searchable.includes(query.toLocaleLowerCase());
      })
    : localizedPosts;
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
  const requestedPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), pageCount) : 1;
  const visiblePosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <PublicShell>
      <main className="medium-blog-index">
        <header className="medium-blog-index__header">
          <div className="container">
            <span className="article-kicker">{translate(language, "common.article")}</span>
            <h1>{translate(language, "pages.blog.title")}</h1>
            <p>{translate(language, "pages.blog.description")}</p>
          </div>
        </header>

        <section className="section medium-blog-index__content">
          <div className="container">
            <form className="blog-search medium-blog-search" action="/blog">
              <Search size={18} aria-hidden="true" />
              <input
                aria-label={translate(language, "pages.blog.searchLabel")}
                defaultValue={query}
                name="q"
                placeholder={translate(language, "pages.blog.searchPlaceholder")}
                type="search"
              />
              <button className="button" type="submit">{translate(language, "common.search")}</button>
              {query ? <Link className="button secondary" href="/blog">{translate(language, "common.clear")}</Link> : null}
            </form>

            {query ? (
              <p className="medium-blog-results-count">
                {language === "vi" ? `${filteredPosts.length} kết quả cho “${query}”` : `${filteredPosts.length} results for “${query}”`}
              </p>
            ) : null}

            <div className="medium-story-list">
              {visiblePosts.map((post) => {
                const document = normalizeArticleDocument(post.contentJson);
                const date = post.firstPublishedAt ?? post.publishedAt ?? post.scheduledAt ?? post.createdAt;
                const author = post.author?.displayName || post.author?.username;
                return (
                  <article className="medium-story-card" key={post.slug}>
                    <Link className="medium-story-card__copy" href={`/blog/${post.slug}`}>
                      <div className="medium-story-card__meta">
                        {author ? <span>{author}</span> : null}
                        <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en", { month: "short", day: "numeric", year: "numeric" }).format(date)}</time>
                      </div>
                      <h2>{post.title}</h2>
                      {post.excerpt ? <p>{post.excerpt}</p> : null}
                      <div className="medium-story-card__footer">
                        {post.tagNames[0] ? <span className="medium-topic-pill">{post.tagNames[0]}</span> : null}
                        <small>{getArticleReadingTime(document, post.content)} {translate(language, "common.minRead")}</small>
                      </div>
                    </Link>
                    {post.featuredImageId ? (
                      <Link className="medium-story-card__image" href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/media/${post.featuredImageId}`} alt="" loading="lazy" />
                      </Link>
                    ) : null}
                  </article>
                );
              })}
            </div>

            {visiblePosts.length === 0 ? (
              <div className="medium-blog-empty">
                <h2>{language === "vi" ? "Chưa tìm thấy bài viết" : "No stories found"}</h2>
                <p>{query ? translate(language, "pages.blog.emptySearch") : language === "vi" ? "Chưa có bài viết nào được xuất bản." : "No posts are published yet."}</p>
                {query ? <Link className="button secondary" href="/blog">{translate(language, "common.clear")}</Link> : null}
              </div>
            ) : null}

            {pageCount > 1 ? (
              <nav className="medium-blog-pagination" aria-label={language === "vi" ? "Phân trang bài viết" : "Article pagination"}>
                {currentPage > 1 ? <Link href={getPageUrl(query, currentPage - 1)}><ArrowLeft size={17} />{language === "vi" ? "Trang trước" : "Previous"}</Link> : <span />}
                <span>{currentPage} / {pageCount}</span>
                {currentPage < pageCount ? <Link href={getPageUrl(query, currentPage + 1)}>{language === "vi" ? "Trang sau" : "Next"}<ArrowRight size={17} /></Link> : <span />}
              </nav>
            ) : null}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function getPageUrl(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/blog?${value}` : "/blog";
}
