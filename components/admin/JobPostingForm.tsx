"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";

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
  const isEditing = Boolean(job);
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving", message: "Saving job posting." });

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
        message: body?.error?.message ?? "Job posting could not be saved."
      });
      return;
    }

    router.push("/admin/careers");
    router.refresh();
  }

  async function onDelete() {
    if (!job) return;
    const confirmed = window.confirm(`Delete "${job.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/careers/${job.id}`, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? "Job posting could not be deleted."
      });
      return;
    }

    router.push("/admin/careers");
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="title">Job Title</label>
        <input id="title" name="title" required minLength={2} maxLength={180} defaultValue={job?.title ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          placeholder="auto-generated from title if blank"
          maxLength={220}
          defaultValue={job?.slug ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="summary">Summary</label>
        <textarea id="summary" name="summary" maxLength={400} defaultValue={job?.summary ?? ""} />
      </div>
      <div className="admin-grid">
        <div className="field">
          <label htmlFor="department">Department</label>
          <input id="department" name="department" maxLength={120} defaultValue={job?.department ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <input id="location" name="location" maxLength={160} defaultValue={job?.location ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="employmentType">Employment Type</label>
          <select id="employmentType" name="employmentType" defaultValue={job?.employmentType ?? "Full-time"}>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Temporary">Temporary</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="workMode">Work Mode</label>
          <select id="workMode" name="workMode" defaultValue={job?.workMode ?? "On-site"}>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="salaryRange">Salary Range</label>
        <input id="salaryRange" name="salaryRange" maxLength={120} placeholder="$70,000 - $90,000" defaultValue={job?.salaryRange ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="description">Job Description</label>
        <textarea id="description" name="description" required minLength={20} defaultValue={job?.description ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="requirements">Requirements</label>
        <textarea id="requirements" name="requirements" defaultValue={job?.requirements ?? ""} />
      </div>
      <div className="admin-grid">
        <div className="field">
          <label htmlFor="applyEmail">Apply Email</label>
          <input id="applyEmail" name="applyEmail" type="email" defaultValue={job?.applyEmail ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="applyUrl">External Apply URL</label>
          <input id="applyUrl" name="applyUrl" type="url" placeholder="https://..." defaultValue={job?.applyUrl ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={job?.status ?? "DRAFT"}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? "Saving" : "Save Job"}
        </button>
        {job ? (
          <button className="button danger" type="button" disabled={state.status === "deleting"} onClick={onDelete}>
            <Trash2 size={18} />
            {state.status === "deleting" ? "Deleting" : "Delete"}
          </button>
        ) : null}
      </div>
      {state.message ? (
        <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
