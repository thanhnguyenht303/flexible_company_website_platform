"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, ExternalLink, Files, Trash2 } from "lucide-react";

type JobStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type JobPostingTableActionsProps = {
  id: string;
  slug: string;
  title: string;
  status: JobStatus;
};

export function JobPostingTableActions({ id, slug, title, status }: JobPostingTableActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: JobStatus) {
    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/careers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
      headers: { "Content-Type": "application/json" }
    });

    setBusy(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error?.message ?? "Status update failed.");
      return;
    }

    router.refresh();
  }

  async function deleteJob() {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/careers/${id}`, { method: "DELETE" });
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
        onChange={(event) => updateStatus(event.target.value as JobStatus)}
      >
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <Link className="icon-button secondary" href={`/admin/careers/${id}/edit`} title="Edit job">
        <Edit size={17} />
      </Link>
      <Link className="icon-button secondary" href={`/admin/careers/${id}/applications`} title="View applications">
        <Files size={17} />
      </Link>
      <Link className="icon-button secondary" href={`/careers/${slug}`} title="View public job">
        <ExternalLink size={17} />
      </Link>
      <button className="icon-button danger" type="button" disabled={busy} onClick={deleteJob} title="Delete job">
        <Trash2 size={17} />
      </button>
      {message ? <span className="message error">{message}</span> : null}
    </div>
  );
}
