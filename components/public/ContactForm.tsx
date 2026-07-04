"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type State = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
};

export function ContactForm() {
  const { t } = useLanguage();
  const [state, setState] = useState<State>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/public/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setState({
        status: "error",
        message: t("forms.contact.error")
      });
      return;
    }

    form.reset();
    setState({ status: "success", message: t("forms.contact.success") });
  }

  return (
    <form className="admin-panel form-grid" onSubmit={onSubmit}>
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="website">{t("common.website")}</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="name">{t("common.name")}</label>
        <input id="name" name="name" required minLength={2} />
      </div>
      <div className="field">
        <label htmlFor="email">{t("common.email")}</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="phone">{t("common.phone")}</label>
        <input id="phone" name="phone" />
      </div>
      <div className="field">
        <label htmlFor="companyName">{t("common.company")}</label>
        <input id="companyName" name="companyName" />
      </div>
      <div className="field">
        <label htmlFor="message">{t("common.message")}</label>
        <textarea id="message" name="message" required minLength={10} />
      </div>
      <button className="button" disabled={state.status === "submitting"} type="submit">
        <Send size={18} />
        {state.status === "submitting" ? t("common.sending") : t("common.send")}
      </button>
      {state.message ? (
        <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
