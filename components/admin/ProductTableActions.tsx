"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, ExternalLink, Trash2 } from "lucide-react";

type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type ProductTableActionsProps = {
  id: string;
  slug: string;
  title: string;
  status: ProductStatus;
};

export function ProductTableActions({ id, slug, title, status }: ProductTableActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: ProductStatus) {
    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/products/${id}`, {
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

  async function deleteProduct() {
    const confirmed = window.confirm(`Delete "${title}"? This will also delete its images.`);
    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
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
        onChange={(event) => updateStatus(event.target.value as ProductStatus)}
      >
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <Link className="icon-button secondary" href={`/admin/products/${id}/edit`} title="Edit product">
        <Edit size={17} />
      </Link>
      <Link className="icon-button secondary" href={`/products/${slug}`} title="View public product">
        <ExternalLink size={17} />
      </Link>
      <button
        className="icon-button danger"
        type="button"
        disabled={busy}
        onClick={deleteProduct}
        title="Delete product"
      >
        <Trash2 size={17} />
      </button>
      {message ? <span className="message error">{message}</span> : null}
    </div>
  );
}
