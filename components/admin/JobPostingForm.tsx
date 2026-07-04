"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type JobStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type JobPostingFormJob = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string;
  requirements: string | null;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  workMode: string | null;
  salaryRange: string | null;
  applyEmail: string | null;
  applyUrl: string | null;
  status: JobStatus;
};

type JobPostingFormProps = {
  job?: JobPostingFormJob;
};

type FormState = {
  status: "idle" | "saving" | "deleting" | "error";
  message: string;
};

export function JobPostingForm({ job }: JobPostingFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const isEditing = Boolean(job);
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving", message: t("admin.messages.jobSaving") });

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch(isEditing ? `/api/admin/careers/${job?.id}` : "/api/admin/careers", {
      method: isEditing ? "PATCH" : "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? t("admin.messages.jobSaveFailed")
      });
      return;
    }

    router.push("/admin/careers");
    router.refresh();
  }

  async function onDelete() {
    if (!job) return;
    const confirmed = window.confirm(t("admin.confirm.deleteJob", { title: job.title }));
    if (!confirmed) return;

    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/careers/${job.id}`, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? t("admin.messages.jobDeleteFailed")
      });
      return;
    }

    router.push("/admin/careers");
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="title">{t("admin.forms.labels.jobTitle")}</label>
        <input id="title" name="title" required minLength={2} maxLength={180} defaultValue={job?.title ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="slug">{t("admin.forms.labels.slug")}</label>
        <input
          id="slug"
          name="slug"
          placeholder={t("admin.forms.placeholders.autoSlug")}
          maxLength={220}
          defaultValue={job?.slug ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="summary">{t("admin.forms.labels.summary")}</label>
        <textarea id="summary" name="summary" maxLength={400} defaultValue={job?.summary ?? ""} />
      </div>
      <div className="admin-grid">
        <div className="field">
          <label htmlFor="department">{t("admin.forms.labels.department")}</label>
          <input id="department" name="department" maxLength={120} defaultValue={job?.department ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="location">{t("admin.forms.labels.location")}</label>
          <input id="location" name="location" maxLength={160} defaultValue={job?.location ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="employmentType">{t("admin.forms.labels.employmentType")}</label>
          <select id="employmentType" name="employmentType" defaultValue={job?.employmentType ?? "Full-time"}>
            <option value="Full-time">{t("admin.forms.options.fullTime")}</option>
            <option value="Part-time">{t("admin.forms.options.partTime")}</option>
            <option value="Contract">{t("admin.forms.options.contract")}</option>
            <option value="Internship">{t("admin.forms.options.internship")}</option>
            <option value="Temporary">{t("admin.forms.options.temporary")}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="workMode">{t("admin.forms.labels.workMode")}</label>
          <select id="workMode" name="workMode" defaultValue={job?.workMode ?? "On-site"}>
            <option value="On-site">{t("admin.forms.options.onsite")}</option>
            <option value="Hybrid">{t("admin.forms.options.hybrid")}</option>
            <option value="Remote">{t("admin.forms.options.remote")}</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="salaryRange">{t("admin.forms.labels.salaryRange")}</label>
        <input id="salaryRange" name="salaryRange" maxLength={120} placeholder={t("admin.forms.placeholders.salaryRange")} defaultValue={job?.salaryRange ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="description">{t("admin.forms.labels.jobDescription")}</label>
        <textarea id="description" name="description" required minLength={20} defaultValue={job?.description ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="requirements">{t("admin.forms.labels.requirements")}</label>
        <textarea id="requirements" name="requirements" defaultValue={job?.requirements ?? ""} />
      </div>
      <div className="admin-grid">
        <div className="field">
          <label htmlFor="applyEmail">{t("admin.forms.labels.applyEmail")}</label>
          <input id="applyEmail" name="applyEmail" type="email" defaultValue={job?.applyEmail ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="applyUrl">{t("admin.forms.labels.externalApplyUrl")}</label>
          <input id="applyUrl" name="applyUrl" type="url" placeholder={t("admin.forms.placeholders.externalUrl")} defaultValue={job?.applyUrl ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="status">{t("admin.forms.labels.status")}</label>
          <select id="status" name="status" defaultValue={job?.status ?? "DRAFT"}>
            <option value="DRAFT">{t("admin.status.DRAFT")}</option>
            <option value="PUBLISHED">{t("admin.status.PUBLISHED")}</option>
            <option value="ARCHIVED">{t("admin.status.ARCHIVED")}</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? t("admin.common.saving") : t("admin.forms.buttons.saveJob")}
        </button>
        {job ? (
          <button className="button danger" type="button" disabled={state.status === "deleting"} onClick={onDelete}>
            <Trash2 size={18} />
            {state.status === "deleting" ? t("admin.common.deleting") : t("admin.common.delete")}
          </button>
        ) : null}
      </div>
      {state.message ? (
        <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
