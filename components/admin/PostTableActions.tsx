"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, ExternalLink, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNLISTED" | "ARCHIVED";

type PostTableActionsProps = {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
};

export function PostTableActions({ id, slug, title, status }: PostTableActionsProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function deletePost() {
    const confirmed = window.confirm(t("admin.confirm.deletePost", { title }));
    if (!confirmed) return;

    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    setBusy(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error?.message ?? t("admin.messages.deleteFailed"));
      return;
    }

    router.refresh();
  }

  return (
    <div className="row-actions">
      <Link className="icon-button secondary" href={`/admin/posts/${id}/edit`} title={t("admin.actions.editPost")}>
        <Edit size={17} />
      </Link>
      {status === "PUBLISHED" || status === "UNLISTED" ? (
        <Link className="icon-button secondary" href={`/blog/${slug}`} title={t("admin.actions.viewPost")}>
          <ExternalLink size={17} />
        </Link>
      ) : null}
      <button className="icon-button danger" type="button" disabled={busy} onClick={deletePost} title={t("admin.actions.deletePost")}>
        <Trash2 size={17} />
      </button>
      {message ? <span className="message error">{message}</span> : null}
    </div>
  );
}
