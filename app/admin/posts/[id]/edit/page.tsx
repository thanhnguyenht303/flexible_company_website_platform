import Link from "next/link";
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

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Edit Post</h1>
        <Link className="button secondary" href="/admin/posts">
          Back
        </Link>
      </div>
      <PostForm
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          status: post.status,
          featuredImageId: post.featuredImageId
        }}
      />
    </AdminShell>
  );
}
