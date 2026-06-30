import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostTableActions } from "@/components/admin/PostTableActions";
import { prisma } from "@/lib/db";

async function getPosts() {
  try {
    return await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return [];
  }
}

export default async function AdminPostsPage() {
  const posts = await getPosts();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Articles</h1>
        <Link className="button" href="/admin/posts/new">
          New
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.slug}>
                <td>
                  {post.featuredImageId ? (
                    <div className="table-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/media/${post.featuredImageId}`} alt="" />
                    </div>
                  ) : (
                    "None"
                  )}
                </td>
                <td>{post.title}</td>
                <td>{post.slug}</td>
                <td>
                  <span className="badge">{post.status}</span>
                </td>
                <td>{post.publishedAt ? post.publishedAt.toLocaleDateString() : "Not published"}</td>
                <td>
                  <PostTableActions
                    id={post.id}
                    slug={post.slug}
                    title={post.title}
                    status={post.status}
                  />
                </td>
              </tr>
            ))}
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6}>No posts yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
