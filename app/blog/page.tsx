import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function BlogPage() {
  const { posts } = await getPublicSiteContext();

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
          <div className="grid">
            {posts.map((post) => (
              <Link className="card" href={`/blog/${post.slug}`} key={post.slug}>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
