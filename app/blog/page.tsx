import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function BlogPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  if (!(await isPublicPageVisible("blog"))) notFound();

  const { posts } = await getPublicSiteContext();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = (resolvedSearchParams.q ?? "").trim();
  const visiblePosts = query
    ? posts.filter((post) => post.title.toLowerCase().includes(query.toLowerCase()))
    : posts;

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Blog</h2>
              <p>Posts support publish status, excerpts, body content, tags, and SEO metadata.</p>
            </div>
          </div>
          <form className="blog-search" action="/blog">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Search posts by title"
              defaultValue={query}
              name="q"
              placeholder="Search posts by title"
              type="search"
            />
            <button className="button" type="submit">
              Search
            </button>
            {query ? (
              <Link className="button secondary" href="/blog">
                Clear
              </Link>
            ) : null}
          </form>
          <div className="blog-card-grid">
            {visiblePosts.map((post) => (
              <Link className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
                <span>Article</span>
                <h3>{post.title}</h3>
                <p>/{post.slug}</p>
                <small>{getReadingTime(post.content)} min read</small>
              </Link>
            ))}
            {visiblePosts.length === 0 ? (
              <p className="message">No posts found with that title.</p>
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
