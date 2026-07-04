"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type TeamTableActionsProps = {
  id: string;
  title: string;
  isVisible: boolean;
};

export function TeamTableActions({ id, title, isVisible }: TeamTableActionsProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateVisibility(nextVisible: boolean) {
    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/team/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isVisible: nextVisible }),
      headers: { "Content-Type": "application/json" }
    });

    setBusy(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error?.message ?? t("admin.messages.visibilityFailed"));
      return;
    }

    router.refresh();
  }

  async function deleteMember() {
    const confirmed = window.confirm(t("admin.confirm.deleteEmployee", { title }));
    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
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
        aria-label={t("admin.actions.visibilityFor", { title })}
        value={String(isVisible)}
        disabled={busy}
        onChange={(event) => updateVisibility(event.target.value === "true")}
      >
        <option value="true">{t("admin.common.visible")}</option>
        <option value="false">{t("admin.common.hidden")}</option>
      </select>
      <Link className="icon-button secondary" href={`/admin/team/${id}/edit`} title={t("admin.actions.editEmployee")}>
        <Edit size={17} />
      </Link>
      <button className="icon-button danger" type="button" disabled={busy} onClick={deleteMember} title={t("admin.actions.deleteEmployee")}>
        <Trash2 size={17} />
      </button>
      {message ? <span className="message error">{message}</span> : null}
    </div>
  );
}
