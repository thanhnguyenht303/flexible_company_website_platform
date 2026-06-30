"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, ExternalLink, Trash2 } from "lucide-react";

type ServiceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type ServiceTableActionsProps = {
  id: string;
  slug: string;
  title: string;
  status: ServiceStatus;
};

export function ServiceTableActions({ id, slug, title, status }: ServiceTableActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: ServiceStatus) {
    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/services/${id}`, {
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

  async function deleteService() {
    const confirmed = window.confirm(`Delete "${title}"? This will also delete its images.`);
    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
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
        onChange={(event) => updateStatus(event.target.value as ServiceStatus)}
      >
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <Link className="icon-button secondary" href={`/admin/services/${id}/edit`} title="Edit service">
        <Edit size={17} />
      </Link>
      <Link className="icon-button secondary" href={`/services/${slug}`} title="View public service">
        <ExternalLink size={17} />
      </Link>
      <button
        className="icon-button danger"
        type="button"
        disabled={busy}
        onClick={deleteService}
        title="Delete service"
      >
        <Trash2 size={17} />
      </button>
      {message ? <span className="message error">{message}</span> : null}
    </div>
  );
}
