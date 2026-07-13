"use client";

import { useState } from "react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { getMissingValueFallback, normalizeCustomTemplateVariables, renderRegisteredTemplate, validateTemplateContent } from "@/modules/email/email.variables";

export type ComposeTemplate = { id: string; name: string; key: string; subject: string; body: string; category: string; customVariables: unknown };

export function EmailComposeForm({
  initialTo = "", templates, variables = {}, relatedType, relatedId, compact = false
}: {
  initialTo?: string;
  templates: ComposeTemplate[];
  variables?: Record<string, string>;
  relatedType?: string;
  relatedId?: string;
  compact?: boolean;
}) {
  const { language, t } = useLanguage();
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [statusAction, setStatusAction] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  function choose(id: string) {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    const fallback = getMissingValueFallback(language);
    const customVariables = normalizeCustomTemplateVariables(template.customVariables);
    setSubject(renderRegisteredTemplate(template.subject, template.category, variables, fallback, customVariables));
    setBody(renderRegisteredTemplate(template.body, template.category, variables, fallback, customVariables));
    const unknown = validateTemplateContent(template.subject, template.body, template.category, customVariables);
    setMessage(unknown.length ? `Unknown template variable: ${unknown.map((item) => item.syntax).join(", ")}` : "");
    setStatusAction(template.key.includes("rejected") ? "REJECTED" : template.key.includes("accepted") ? "ACCEPTED" : template.key.includes("interview") ? "INTERVIEW" : template.key.includes("more-information") ? "NEED_MORE_INFO" : "");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: splitEmails(data.get("to")), cc: splitEmails(data.get("cc")), bcc: [],
        subject, body, templateId: templateId || null, variables,
        relatedType, relatedId, statusAction: statusAction || undefined
      })
    });
    const result = await response.json();
    setMessage(response.ok ? t("admin.email.sentSuccessfully") : result.error?.message || t("admin.email.sendFailed"));
    setBusy(false);
  }

  return (
    <form className={compact ? "email-compose email-compose--compact" : "admin-panel email-compose"} onSubmit={submit}>
      <div className="form-grid">
        <label><span>To</span><input name="to" type="text" defaultValue={initialTo} required /></label>
        <label><span>CC</span><input name="cc" type="text" /></label>
        <label><span>{t("admin.email.templates")}</span><select value={templateId} onChange={(event) => choose(event.target.value)}><option value="">Custom email</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        {relatedType === "jobApplication" ? <label><span>Application status after successful send</span><select value={statusAction} onChange={(event) => setStatusAction(event.target.value)}><option value="">Do not change</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option><option value="INTERVIEW">Interview</option><option value="NEED_MORE_INFO">Needs more information</option></select></label> : null}
        <label className="form-grid__wide"><span>{t("admin.email.subject")}</span><input value={subject} onChange={(event) => setSubject(event.target.value)} required /></label>
        <label className="form-grid__wide"><span>{t("admin.email.body")}</span><textarea rows={compact ? 8 : 14} value={body} onChange={(event) => setBody(event.target.value)} required /></label>
      </div>
      <button className="button" disabled={busy}>{busy ? "Sending…" : t("admin.email.compose")}</button>
      <button className="button secondary" type="button" onClick={() => setPreviewOpen((value) => !value)}>{t("admin.email.guide.previewReal")}</button>
      {message ? <p className="message" role="status">{message}</p> : null}
      {previewOpen ? <section className="email-compose-preview"><h3>{t("admin.email.guide.renderedEmail")}</h3><h4>{subject || t("admin.email.guide.noSubject")}</h4><pre>{body || t("admin.email.guide.noBody")}</pre></section> : null}
    </form>
  );
}

function splitEmails(value: FormDataEntryValue | null) { return String(value ?? "").split(/[;,\n]/).map((item) => item.trim()).filter(Boolean); }
