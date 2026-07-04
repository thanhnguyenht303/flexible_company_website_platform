import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NewPostPage() {
  const { t } = await getServerTranslations();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.newArticle")}</h1>
        <Link className="button secondary" href="/admin/posts">
          {t("admin.common.back")}
        </Link>
      </div>
      <PostForm />
    </AdminShell>
  );
}
