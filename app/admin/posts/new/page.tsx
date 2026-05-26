import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>New Post</h1>
        <Link className="button secondary" href="/admin/posts">
          Back
        </Link>
      </div>
      <PostForm />
    </AdminShell>
  );
}
