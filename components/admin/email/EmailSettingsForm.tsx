"use client";

import { useState } from "react";
import { useLanguage } from "@/components/public/LanguageProvider";

type Settings = {
  defaultReceivingEmail?: string | null;
  defaultSenderName?: string | null;
  defaultSenderEmail?: string | null;
  replyToEmail?: string | null;
  notificationEmails?: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  emailNotificationsEnabled?: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpSecure?: boolean;
  imapHost?: string | null;
  imapPort?: number | null;
  imapUsername?: string | null;
  imapSecure?: boolean;
  imapLastSyncAt?: string | Date | null;
  inboundEmailAddress?: string | null;
  hasSmtpPassword?: boolean;
  hasImapPassword?: boolean;
  hasInboundWebhookSecret?: boolean;
};

export function EmailSettingsForm({ initial }: { initial: Settings | null }) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/email/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultReceivingEmail: form.get("defaultReceivingEmail"),
        defaultSenderName: form.get("defaultSenderName"),
        defaultSenderEmail: form.get("defaultSenderEmail"),
        replyToEmail: form.get("replyToEmail"),
        notificationEmails: splitEmails(form.get("notificationEmails")),
        ccEmails: splitEmails(form.get("ccEmails")),
        bccEmails: splitEmails(form.get("bccEmails")),
        emailNotificationsEnabled: form.get("emailNotificationsEnabled") === "on",
        smtpHost: form.get("smtpHost"),
        smtpPort: Number(form.get("smtpPort")) || null,
        smtpUsername: form.get("smtpUsername"),
        smtpPassword: form.get("smtpPassword"),
        smtpSecure: form.get("smtpSecure") === "on",
        imapHost: form.get("imapHost"),
        imapPort: Number(form.get("imapPort")) || null,
        imapUsername: form.get("imapUsername"),
        imapPassword: form.get("imapPassword"),
        imapSecure: form.get("imapSecure") === "on",
        inboundEmailAddress: form.get("inboundEmailAddress"),
        inboundWebhookSecret: form.get("inboundWebhookSecret")
      })
    });
    const result = await response.json();
    setMessage(response.ok ? t("admin.email.settingsSaved") : result.error?.message || "Save failed.");
    setBusy(false);
  }

  async function test(path: string, body?: unknown) {
    setBusy(true);
    setMessage("");
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    setMessage(response.ok ? (path.endsWith("test-smtp") ? "SMTP connection succeeded." : path.endsWith("test-imap") ? "IMAP connection succeeded." : t("admin.email.sentSuccessfully")) : result.error?.message || "Test failed.");
    setBusy(false);
  }

  return (
    <form className="admin-panel" onSubmit={save}>
      <div className="form-grid">
        <Field label={t("admin.email.defaultReceivingEmail")} name="defaultReceivingEmail" type="email" value={initial?.defaultReceivingEmail} />
        <Field label={t("admin.email.senderName")} name="defaultSenderName" value={initial?.defaultSenderName} />
        <Field label={t("admin.email.senderEmail")} name="defaultSenderEmail" type="email" value={initial?.defaultSenderEmail} />
        <Field label={t("admin.email.replyTo")} name="replyToEmail" type="email" value={initial?.replyToEmail} />
        <Field label={t("admin.email.notificationRecipients")} name="notificationEmails" value={initial?.notificationEmails?.join(", ")} help="Separate multiple addresses with commas." />
        <Field label={t("admin.email.ccRecipients")} name="ccEmails" value={initial?.ccEmails?.join(", ")} />
        <Field label={t("admin.email.bccRecipients")} name="bccEmails" value={initial?.bccEmails?.join(", ")} />
        <label className="checkbox-row"><input type="checkbox" name="emailNotificationsEnabled" defaultChecked={initial?.emailNotificationsEnabled ?? true} /> {t("admin.email.notificationsEnabled")}</label>
      </div>
      <h2>Outgoing SMTP</h2>
      <div className="form-grid">
        <Field label={t("admin.email.smtpHost")} name="smtpHost" value={initial?.smtpHost} />
        <Field label={t("admin.email.smtpPort")} name="smtpPort" type="number" value={initial?.smtpPort ?? 587} />
        <Field label={t("admin.email.smtpUsername")} name="smtpUsername" value={initial?.smtpUsername} />
        <Field label={t("admin.email.smtpPassword")} name="smtpPassword" type="password" help={initial?.hasSmtpPassword ? "A password is saved. Leave blank to keep it." : undefined} />
        <label className="checkbox-row"><input type="checkbox" name="smtpSecure" defaultChecked={initial?.smtpSecure} /> {t("admin.email.smtpSecure")}</label>
      </div>
      <h2>Incoming IMAP</h2>
      <p className="message">IMAP imports messages into the Email Center inbox. Gmail can use the same App Password as SMTP.</p>
      <div className="form-grid">
        <Field label={t("admin.email.imapHost")} name="imapHost" value={initial?.imapHost} />
        <Field label={t("admin.email.imapPort")} name="imapPort" type="number" value={initial?.imapPort ?? 993} />
        <Field label={t("admin.email.imapUsername")} name="imapUsername" value={initial?.imapUsername} />
        <Field label={t("admin.email.imapPassword")} name="imapPassword" type="password" help={initial?.hasImapPassword ? "An IMAP password is saved. Leave blank to keep it." : "Leave blank to reuse the saved SMTP password."} />
        <label className="checkbox-row"><input type="checkbox" name="imapSecure" defaultChecked={initial?.imapSecure ?? true} /> {t("admin.email.imapSecure")}</label>
      </div>
      <h2>Incoming webhook</h2>
      <div className="form-grid">
        <Field label={t("admin.email.inboundAddress")} name="inboundEmailAddress" type="email" value={initial?.inboundEmailAddress} />
        <Field label={t("admin.email.webhookSecret")} name="inboundWebhookSecret" type="password" help={initial?.hasInboundWebhookSecret ? "A secret is saved. Providers send it in the X-Email-Webhook-Secret header." : "At least 24 characters."} />
      </div>
      <div className="form-actions">
        <button className="button" disabled={busy}>{busy ? t("admin.common.saving") : t("admin.email.saveSettings")}</button>
        <button className="button secondary" type="button" disabled={busy} onClick={() => test("/api/admin/email/settings/test-smtp")}>{t("admin.email.testConnection")}</button>
        <button className="button secondary" type="button" disabled={busy} onClick={() => test("/api/admin/email/settings/test-imap")}>{t("admin.email.testImap")}</button>
        <button className="button secondary" type="button" disabled={busy || !initial?.defaultReceivingEmail} onClick={() => test("/api/admin/email/settings/test-email", { to: initial?.defaultReceivingEmail })}>{t("admin.email.sendTest")}</button>
      </div>
      {message ? <p className="message" role="status">{message}</p> : null}
    </form>
  );
}

function Field({ label, name, type = "text", value, help }: { label: string; name: string; type?: string; value?: string | number | null; help?: string }) {
  return <label><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} />{help ? <small className="message">{help}</small> : null}</label>;
}

function splitEmails(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/[;,\n]/).map((item) => item.trim()).filter(Boolean);
}
