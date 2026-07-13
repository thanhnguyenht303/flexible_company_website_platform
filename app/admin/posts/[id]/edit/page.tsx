import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { prisma } from "@/lib/db";

async function getPost(id: string) {
  try {
    return await prisma.post.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <AdminShell requiredAuthority="posts.manage">
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
          contentJson: post.contentJson,
          contentJsonVi: post.contentJsonVi,
          status: post.status,
          tagNames: post.tagNames,
          featuredImageId: post.featuredImageId,
          featuredImageAlt: post.featuredImageAlt,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          canonicalUrl: post.canonicalUrl,
          scheduledAt: post.scheduledAt?.toISOString() ?? null,
          revisionNumber: post.revisionNumber
        }}
      />
    </AdminShell>
  );
}
