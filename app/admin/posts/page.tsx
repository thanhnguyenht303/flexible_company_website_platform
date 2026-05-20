import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AdminPostsPage() {
  const { posts } = await getPublicSiteContext();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Posts</h1>
        <button className="button" type="button">
          New
        </button>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.slug}>
                <td>{post.title}</td>
                <td>{post.slug}</td>
                <td>
                  <span className="badge">Published</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
