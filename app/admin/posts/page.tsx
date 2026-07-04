import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostTableActions } from "@/components/admin/PostTableActions";
import { prisma } from "@/lib/db";
import { localizedField } from "@/lib/i18n/content";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

async function getPosts() {
  return prisma.post.findMany({ orderBy: { createdAt: "desc" } });
}

export default async function AdminPostsPage() {
  const [posts, { language, t }] = await Promise.all([getPosts(), getServerTranslations()]);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.common.articles")}</h1>
        <Link className="button" href="/admin/posts/new">
          {t("admin.common.new")}
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.common.image")}</th>
              <th>{t("admin.common.title")}</th>
              <th>{t("admin.common.slug")}</th>
              <th>{t("admin.common.status")}</th>
              <th>{t("admin.common.published")}</th>
              <th>{t("admin.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const title = localizedField(post, "title", language);
              return (
                <tr key={post.slug}>
                  <td>
                    {post.featuredImageId ? (
                      <div className="table-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/media/${post.featuredImageId}`} alt="" />
                      </div>
                    ) : (
                      t("admin.common.none")
                    )}
                  </td>
                  <td>{title}</td>
                  <td>{post.slug}</td>
                  <td>
                    <span className="badge">{t(`admin.status.${post.status}`)}</span>
                  </td>
                  <td>{post.publishedAt ? post.publishedAt.toLocaleDateString() : t("admin.common.notPublished")}</td>
                  <td>
                    <PostTableActions id={post.id} slug={post.slug} title={title} status={post.status} />
                  </td>
                </tr>
              );
            })}
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6}>{t("admin.empty.posts")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
