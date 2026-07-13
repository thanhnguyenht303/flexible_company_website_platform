import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostTableActions } from "@/components/admin/PostTableActions";
import { prisma } from "@/lib/db";
import { localizedField } from "@/lib/i18n/content";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

async function getPosts() {
  return prisma.post.findMany({
    include: { author: { select: { displayName: true, username: true } } },
    orderBy: { updatedAt: "desc" }
  });
}

export default async function AdminPostsPage() {
  const [posts, { language, t }] = await Promise.all([getPosts(), getServerTranslations()]);

  return (
    <AdminShell requiredAuthority="posts.manage">
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
              <th scope="col">{t("admin.common.image")}</th>
              <th scope="col">{t("admin.common.title")}</th>
              <th scope="col">{t("admin.common.slug")}</th>
              <th scope="col">{t("admin.common.status")}</th>
              <th scope="col">{language === "vi" ? "Tác giả / Cập nhật" : "Author / Updated"}</th>
              <th scope="col">{t("admin.common.actions")}</th>
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
                        <img src={`/api/media/${post.featuredImageId}`} alt={post.featuredImageAlt || title} />
                      </div>
                    ) : (
                      t("admin.common.none")
                    )}
                  </td>
                  <td>{title}</td>
                  <td>{post.slug}</td>
                  <td>
                    <span className={`badge status-${post.status.toLowerCase()}`}>{formatPostStatus(post.status, language)}</span>
                  </td>
                  <td>
                    <strong>{post.author?.displayName || post.author?.username || (language === "vi" ? "Quản trị viên" : "Administrator")}</strong>
                    <small className="table-secondary-line">{post.updatedAt.toLocaleDateString(language === "vi" ? "vi-VN" : "en")}</small>
                  </td>
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

function formatPostStatus(status: string, language: string) {
  const labels: Record<string, [string, string]> = {
    DRAFT: ["Draft", "Bản nháp"],
    SCHEDULED: ["Scheduled", "Đã lên lịch"],
    PUBLISHED: ["Published", "Đã xuất bản"],
    UNLISTED: ["Unlisted", "Không liệt kê"],
    ARCHIVED: ["Archived", "Đã lưu trữ"]
  };
  return labels[status]?.[language === "vi" ? 1 : 0] ?? status;
}
