import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";

export default async function NewPostPage() {
  return (
    <AdminShell requiredAuthority="posts.manage">
      <PostForm />
    </AdminShell>
  );
}
