import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleShareActions } from "@/components/public/ArticleShareActions";
import { PublicShell } from "@/components/public/PublicShell";
import { ArticleContent } from "@/components/shared/ArticleContent";
import { env } from "@/lib/env";
import { localizePost } from "@/lib/i18n/content";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate, type Language } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";
import { getArticleReadingTime, normalizeArticleDocument } from "@/modules/blog/article-document";
import { getPublicPostBySlug } from "@/modules/blog/blog.service";

const getPost = cache(getPublicPostBySlug);

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [postRecord, language, { site }] = await Promise.all([
    getPost(slug),
    getCurrentLanguage(),
    getPublicSiteContext()
  ]);
  if (!postRecord) return {};

  const post = localizePost(postRecord, language);
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || site.description || undefined;
  const canonical = post.canonicalUrl || new URL(`/blog/${post.slug}`, env.NEXT_PUBLIC_SITE_URL).toString();
  const image = post.featuredImageId
    ? new URL(`/api/media/${post.featuredImageId}`, env.NEXT_PUBLIC_SITE_URL).toString()
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      publishedTime: (post.firstPublishedAt ?? post.publishedAt ?? post.createdAt).toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tagNames,
      ...(image ? { images: [{ url: image, alt: post.featuredImageAlt || post.title }] } : {})
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {})
    },
    robots: post.status === "UNLISTED" ? { index: false, follow: true } : undefined
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (!(await isPublicPageVisible("blog"))) notFound();

  const [postRecord, language, { site }] = await Promise.all([
    getPost(slug),
    getCurrentLanguage(),
    getPublicSiteContext()
  ]);
  if (!postRecord) notFound();

  const post = localizePost(postRecord, language);
  const document = normalizeArticleDocument(post.contentJson);
  const publicationDate = post.firstPublishedAt ?? post.publishedAt ?? post.scheduledAt ?? post.createdAt;
  const authorName = post.author?.displayName || post.author?.username || site.siteName;
  const readingTime = getArticleReadingTime(document, post.content);
  const canonical = post.canonicalUrl || new URL(`/blog/${post.slug}`, env.NEXT_PUBLIC_SITE_URL).toString();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    datePublished: publicationDate.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: canonical,
    author: { "@type": post.author ? "Person" : "Organization", name: authorName },
    publisher: { "@type": "Organization", name: site.siteName },
    ...(post.featuredImageId
      ? { image: new URL(`/api/media/${post.featuredImageId}`, env.NEXT_PUBLIC_SITE_URL).toString() }
      : {})
  };

  return (
    <PublicShell>
      <article className="article-page medium-public-article">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <header className="article-header">
          {post.tagNames.length ? <div className="article-kicker">{post.tagNames[0]}</div> : null}
          <h1>{post.title}</h1>
          {post.excerpt ? <p className="article-deck">{post.excerpt}</p> : null}
          <div className="medium-article-byline">
            <span className="medium-author-avatar" aria-hidden="true">{authorName.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{authorName}</strong>
              <div className="article-meta">
                <span>{formatArticleDate(publicationDate, language)}</span>
                <span>{readingTime} {translate(language, "common.minRead")}</span>
                {post.updatedAt.getTime() - publicationDate.getTime() > 86_400_000 ? (
                  <span>{language === "vi" ? "Đã cập nhật" : "Updated"} {formatArticleDate(post.updatedAt, language)}</span>
                ) : null}
              </div>
            </div>
          </div>
          <ArticleShareActions title={post.title} url={canonical} language={language} />
        </header>
        {post.featuredImageId ? (
          <figure className="article-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${post.featuredImageId}`} alt={post.featuredImageAlt || post.title} />
          </figure>
        ) : null}
        <div className="article-content-wrap">
          <ArticleContent content={post.content} document={document} />
          {post.tagNames.length ? (
            <footer className="article-topic-list" aria-label={language === "vi" ? "Chủ đề bài viết" : "Article topics"}>
              {post.tagNames.map((tag) => <span key={tag}>{tag}</span>)}
            </footer>
          ) : null}
        </div>
      </article>
    </PublicShell>
  );
}

function formatArticleDate(date: Date | string, language: Language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}
