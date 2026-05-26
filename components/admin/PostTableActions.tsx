"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, ExternalLink, Trash2 } from "lucide-react";

type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type PostTableActionsProps = {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
};

export function PostTableActions({ id, slug, title, status }: PostTableActionsProps) {
  const router = useRouter();
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
      setMessage(body?.error?.message ?? "Status update failed.");
      return;
    }

    router.refresh();
  }

  async function deletePost() {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    setBusy(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error?.message ?? "Delete failed.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="row-actions">
      <select
        aria-label={`Status for ${title}`}
        value={status}
        disabled={busy}
        onChange={(event) => updateStatus(event.target.value as PostStatus)}
      >
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <Link className="icon-button secondary" href={`/admin/posts/${id}/edit`} title="Edit post">
        <Edit size={17} />
      </Link>
      <Link className="icon-button secondary" href={`/blog/${slug}`} title="View public post">
        <ExternalLink size={17} />
      </Link>
      <button className="icon-button danger" type="button" disabled={busy} onClick={deletePost} title="Delete post">
        <Trash2 size={17} />
      </button>
      {message ? <span className="message error">{message}</span> : null}
    </div>
  );
}
