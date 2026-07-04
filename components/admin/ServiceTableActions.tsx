"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, ExternalLink, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type ServiceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type ServiceTableActionsProps = {
  id: string;
  slug: string;
  title: string;
  status: ServiceStatus;
};

export function ServiceTableActions({ id, slug, title, status }: ServiceTableActionsProps) {
  const router = useRouter();
  const { t } = useLanguage();
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
      setMessage(body?.error?.message ?? t("admin.messages.statusFailed"));
      return;
    }

    router.refresh();
  }

  async function deleteService() {
    const confirmed = window.confirm(t("admin.confirm.deleteService", { title }));
    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
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
        onChange={(event) => updateStatus(event.target.value as ServiceStatus)}
      >
        <option value="DRAFT">{t("admin.status.DRAFT")}</option>
        <option value="PUBLISHED">{t("admin.status.PUBLISHED")}</option>
        <option value="ARCHIVED">{t("admin.status.ARCHIVED")}</option>
      </select>
      <Link className="icon-button secondary" href={`/admin/services/${id}/edit`} title={t("admin.actions.editService")}>
        <Edit size={17} />
      </Link>
      <Link className="icon-button secondary" href={`/services/${slug}`} title={t("admin.actions.viewService")}>
        <ExternalLink size={17} />
      </Link>
      <button
        className="icon-button danger"
        type="button"
        disabled={busy}
        onClick={deleteService}
        title={t("admin.actions.deleteService")}
      >
        <Trash2 size={17} />
      </button>
      {message ? <span className="message error">{message}</span> : null}
    </div>
  );
}
