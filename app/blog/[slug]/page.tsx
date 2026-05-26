import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const { posts } = await getPublicSiteContext();
  const post = posts.find((item) => item.slug === params.slug);
  if (!post) notFound();

  return (
    <PublicShell>
      <article className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </div>
          </div>
          {"featuredImageId" in post && post.featuredImageId ? (
            <div className="post-hero-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${post.featuredImageId}`} alt="" />
            </div>
          ) : null}
          <div className="card">
            <p>{post.content}</p>
          </div>
        </div>
      </article>
    </PublicShell>
  );
}
