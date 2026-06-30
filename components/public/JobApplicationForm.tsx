"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type JobApplicationFormProps = {
  jobId: string;
  jobTitle: string;
};

type State = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
};

export function JobApplicationForm({ jobId, jobTitle }: JobApplicationFormProps) {
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
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? "The application could not be sent."
      });
      return;
    }

    form.reset();
    setState({ status: "success", message: "Thanks. Your application has been received." });
  }

  return (
    <form className="admin-panel form-grid" onSubmit={onSubmit}>
      <h2>Apply for {jobTitle}</h2>
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="application-website">Website</label>
        <input id="application-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required minLength={2} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" />
      </div>
      <div className="field">
        <label htmlFor="companyName">Current Company</label>
        <input id="companyName" name="companyName" />
      </div>
      <div className="field">
        <label htmlFor="resume">Resume</label>
        <label className="file-dropbox" htmlFor="resume">
          <span>Choose a resume file</span>
          <small>PDF, DOC, or DOCX up to 10MB</small>
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
        <label htmlFor="message">Short Note</label>
        <textarea id="message" name="message" placeholder="Optional note, portfolio link, or LinkedIn profile." />
      </div>
      <button className="button" disabled={state.status === "submitting"} type="submit">
        <Send size={18} />
        {state.status === "submitting" ? "Sending" : "Apply"}
      </button>
      {state.message ? (
        <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
