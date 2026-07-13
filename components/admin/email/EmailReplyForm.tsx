"use client";

import { useState } from "react";
import { useLanguage } from "@/components/public/LanguageProvider";

export function EmailReplyForm({ messageId }: { messageId: string }) {
  const { t } = useLanguage();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setStatus("");
    const response = await fetch(`/api/admin/email/messages/${messageId}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    const result = await response.json();
    setStatus(response.ok ? t("admin.email.sentSuccessfully") : result.error?.message || t("admin.email.sendFailed"));
    if (response.ok) setBody("");
    setBusy(false);
  }
  return <form className="admin-panel" onSubmit={submit}><h2>{t("admin.email.reply")}</h2><textarea rows={8} value={body} onChange={(event) => setBody(event.target.value)} required /><div className="form-actions"><button className="button" disabled={busy}>{busy ? "Sending…" : t("admin.email.reply")}</button></div>{status ? <p className="message" role="status">{status}</p> : null}</form>;
}
