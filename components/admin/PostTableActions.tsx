"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, ExternalLink, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

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

  async function updateStatus(nextStatus: PostStatus) {
    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    setBusy(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error?.message ?? t("admin.messages.statusFailed"));
      return;
    }

    router.refresh();
  }

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
      <select
        aria-label={t("admin.actions.statusFor", { title })}
        value={status}
        disabled={busy}
        onChange={(event) => updateStatus(event.target.value as PostStatus)}
      >
        <option value="DRAFT">{t("admin.status.DRAFT")}</option>
        <option value="PUBLISHED">{t("admin.status.PUBLISHED")}</option>
        <option value="ARCHIVED">{t("admin.status.ARCHIVED")}</option>
      </select>
      <Link className="icon-button secondary" href={`/admin/posts/${id}/edit`} title={t("admin.actions.editPost")}>
        <Edit size={17} />
      </Link>
      <Link className="icon-button secondary" href={`/blog/${slug}`} title={t("admin.actions.viewPost")}>
        <ExternalLink size={17} />
      </Link>
      <button className="icon-button danger" type="button" disabled={busy} onClick={deletePost} title={t("admin.actions.deletePost")}>
        <Trash2 size={17} />
      </button>
      {message ? <span className="message error">{message}</span> : null}
    </div>
  );
}
