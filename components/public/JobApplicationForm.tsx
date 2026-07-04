"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type JobApplicationFormProps = {
  jobId: string;
  jobTitle: string;
};

type State = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
};

export function JobApplicationForm({ jobId, jobTitle }: JobApplicationFormProps) {
  const { t } = useLanguage();
  const [state, setState] = useState<State>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch(`/api/public/careers/${jobId}/applications`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      setState({
        status: "error",
        message: t("forms.job.error")
      });
      return;
    }

    form.reset();
    setState({ status: "success", message: t("forms.job.success") });
  }

  return (
    <form className="admin-panel form-grid" onSubmit={onSubmit}>
      <h2>{t("forms.job.applyFor", { jobTitle })}</h2>
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="application-website">{t("common.website")}</label>
        <input id="application-website" name="website" tabIndex={-1} autoComplete="off" />
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
        <label htmlFor="companyName">{t("forms.job.currentCompany")}</label>
        <input id="companyName" name="companyName" />
      </div>
      <div className="field">
        <label htmlFor="resume">{t("forms.job.resume")}</label>
        <label className="file-dropbox" htmlFor="resume">
          <span>{t("forms.job.chooseResume")}</span>
          <small>{t("forms.job.resumeHelp")}</small>
          <input
            id="resume"
            name="resume"
            type="file"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx"
            required
          />
        </label>
      </div>
      <div className="field">
        <label htmlFor="message">{t("forms.job.shortNote")}</label>
        <textarea id="message" name="message" placeholder={t("forms.job.shortNotePlaceholder")} />
      </div>
      <button className="button" disabled={state.status === "submitting"} type="submit">
        <Send size={18} />
        {state.status === "submitting" ? t("common.sending") : t("common.apply")}
      </button>
      {state.message ? (
        <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
