import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

async function getPost(id: string) {
  try {
    return await prisma.post.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, { t }] = await Promise.all([getPost(id), getServerTranslations()]);
  if (!post) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.editArticle")}</h1>
        <Link className="button secondary" href="/admin/posts">
          {t("admin.common.back")}
        </Link>
      </div>
      <PostForm
        post={{
          id: post.id,
          title: post.title,
          titleVi: post.titleVi,
          slug: post.slug,
          excerpt: post.excerpt,
          excerptVi: post.excerptVi,
          content: post.content,
          contentVi: post.contentVi,
          status: post.status,
          featuredImageId: post.featuredImageId
        }}
      />
    </AdminShell>
  );
}
