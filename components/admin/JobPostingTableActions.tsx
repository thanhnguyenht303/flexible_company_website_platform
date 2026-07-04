"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, ExternalLink, Files, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type JobStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type JobPostingTableActionsProps = {
  id: string;
  slug: string;
  title: string;
  status: JobStatus;
};

export function JobPostingTableActions({ id, slug, title, status }: JobPostingTableActionsProps) {
  const router = useRouter();
  const { t } = useLanguage();
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
      setMessage(body?.error?.message ?? t("admin.messages.statusFailed"));
      return;
    }

    router.refresh();
  }

  async function deleteJob() {
    const confirmed = window.confirm(t("admin.confirm.deleteJob", { title }));
    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/careers/${id}`, { method: "DELETE" });
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
        onChange={(event) => updateStatus(event.target.value as JobStatus)}
      >
        <option value="DRAFT">{t("admin.status.DRAFT")}</option>
        <option value="PUBLISHED">{t("admin.status.PUBLISHED")}</option>
        <option value="ARCHIVED">{t("admin.status.ARCHIVED")}</option>
      </select>
      <Link className="icon-button secondary" href={`/admin/careers/${id}/edit`} title={t("admin.actions.editJob")}>
        <Edit size={17} />
      </Link>
      <Link className="icon-button secondary" href={`/admin/careers/${id}/applications`} title={t("admin.actions.viewApplications")}>
        <Files size={17} />
      </Link>
      <Link className="icon-button secondary" href={`/careers/${slug}`} title={t("admin.actions.viewJob")}>
        <ExternalLink size={17} />
      </Link>
      <button className="icon-button danger" type="button" disabled={busy} onClick={deleteJob} title={t("admin.actions.deleteJob")}>
        <Trash2 size={17} />
      </button>
      {message ? <span className="message error">{message}</span> : null}
    </div>
  );
}
