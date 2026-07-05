"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { priorityLabel, statusLabel } from "@/modules/forms/forms.labels";
import { leadPriorities, leadStatuses } from "@/modules/forms/forms.types";

type LeadEditFormProps = {
  lead: {
    id: string;
    status: string;
    priority: string;
    internalNote: string | null;
    followUpAt: Date | null;
  };
};

export function LeadEditForm({ lead }: LeadEditFormProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [state, setState] = useState({ saving: false, message: "", error: false });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState({ saving: true, message: "", error: false });
    const response = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: formData.get("status"),
        priority: formData.get("priority"),
        internalNote: formData.get("internalNote"),
        followUpAt: toIsoDateTime(formData.get("followUpAt"))
      })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({ saving: false, message: body?.error?.message || t("formsFeature.publicForm.error"), error: true });
      return;
    }

    setState({ saving: false, message: t("admin.common.saved"), error: false });
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="status">{t("formsFeature.common.status")}</label>
        <select id="status" name="status" defaultValue={lead.status}>
          {leadStatuses.map((status) => (
            <option value={status} key={status}>
              {statusLabel(language, status)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="priority">{t("formsFeature.leads.priority")}</label>
        <select id="priority" name="priority" defaultValue={lead.priority}>
          {leadPriorities.map((priority) => (
            <option value={priority} key={priority}>
              {priorityLabel(language, priority)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="followUpAt">{t("formsFeature.leads.followUpDate")}</label>
        <input id="followUpAt" name="followUpAt" type="datetime-local" defaultValue={toInputDate(lead.followUpAt)} />
      </div>
      <div className="field form-grid__wide">
        <label htmlFor="internalNote">{t("formsFeature.leads.internalNotes")}</label>
        <textarea id="internalNote" name="internalNote" defaultValue={lead.internalNote ?? ""} />
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={state.saving}>
          <Save size={18} />
          {state.saving ? t("admin.common.saving") : t("formsFeature.leads.updateLead")}
        </button>
      </div>
      {state.message ? <p className={`message ${state.error ? "error" : ""}`}>{state.message}</p> : null}
    </form>
  );
}

function toIsoDateTime(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text ? new Date(text).toISOString() : null;
}

function toInputDate(value: Date | null) {
  if (!value) return "";
  const local = new Date(value);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}
