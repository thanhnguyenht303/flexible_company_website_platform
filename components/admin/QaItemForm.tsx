"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { statusLabel } from "@/modules/forms/forms.labels";
import { qaStatuses } from "@/modules/forms/forms.types";

type QaItemFormProps = {
  item?: {
    id: string;
    title: string;
    slug: string;
    question: string;
    answer: string | null;
    submitterName: string | null;
    submitterEmail: string | null;
    category: string | null;
    status: string;
    relatedType: string | null;
    relatedId: string | null;
  };
};

export function QaItemForm({ item }: QaItemFormProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isEditing = Boolean(item);
  const [state, setState] = useState({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      title: String(data.get("title") ?? ""),
      slug: String(data.get("slug") ?? ""),
      question: String(data.get("question") ?? ""),
      answer: emptyToNull(data.get("answer")),
      submitterName: emptyToNull(data.get("submitterName")),
      submitterEmail: emptyToNull(data.get("submitterEmail")) ?? "",
      category: emptyToNull(data.get("category")),
      status: String(data.get("status") ?? "NEW"),
      relatedType: emptyToNull(data.get("relatedType")),
      relatedId: emptyToNull(data.get("relatedId"))
    };

    setState({ status: "saving", message: "" });
    const response = await fetch(isEditing ? `/api/admin/qa/${item?.id}` : "/api/admin/qa", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const fieldErrors = body?.error?.fields ? Object.values(body.error.fields).join(" ") : "";
      setState({ status: "error", message: fieldErrors || body?.error?.message || t("formsFeature.publicForm.error") });
      return;
    }

    router.push("/admin/qa");
    router.refresh();
  }

  async function onDelete() {
    if (!item) return;
    if (!window.confirm(`${t("formsFeature.common.delete")} "${item.title}"?`)) return;
    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/qa/${item.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({ status: "error", message: body?.error?.message || t("formsFeature.publicForm.error") });
      return;
    }
    router.push("/admin/qa");
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="title">{t("formsFeature.qa.questionTitle")}</label>
        <input id="title" name="title" required minLength={2} maxLength={220} defaultValue={item?.title ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="slug">{t("formsFeature.forms.slug")}</label>
        <input id="slug" name="slug" maxLength={240} defaultValue={item?.slug ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="status">{t("formsFeature.common.status")}</label>
        <select id="status" name="status" defaultValue={item?.status ?? "NEW"}>
          {qaStatuses.map((status) => (
            <option value={status} key={status}>
              {statusLabel(language, status)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="category">{t("formsFeature.common.category")}</label>
        <input id="category" name="category" maxLength={120} defaultValue={item?.category ?? ""} />
      </div>
      <div className="field form-grid__wide">
        <label htmlFor="question">{t("formsFeature.qa.question")}</label>
        <textarea id="question" name="question" required minLength={10} defaultValue={item?.question ?? ""} />
      </div>
      <div className="field form-grid__wide">
        <label htmlFor="answer">{t("formsFeature.qa.officialAnswer")}</label>
        <textarea id="answer" name="answer" defaultValue={item?.answer ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="submitterName">{t("formsFeature.qa.submitter")}</label>
        <input id="submitterName" name="submitterName" maxLength={160} defaultValue={item?.submitterName ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="submitterEmail">{t("formsFeature.leads.email")}</label>
        <input id="submitterEmail" name="submitterEmail" type="email" defaultValue={item?.submitterEmail ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="relatedType">{t("formsFeature.forms.linkedEntityType")}</label>
        <input id="relatedType" name="relatedType" maxLength={80} defaultValue={item?.relatedType ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="relatedId">{t("formsFeature.forms.linkedEntityId")}</label>
        <input id="relatedId" name="relatedId" maxLength={180} defaultValue={item?.relatedId ?? ""} />
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? t("admin.common.saving") : t("formsFeature.qa.editQa")}
        </button>
        {item ? (
          <button className="button danger" type="button" disabled={state.status === "deleting"} onClick={onDelete}>
            <Trash2 size={18} />
            {t("formsFeature.common.delete")}
          </button>
        ) : null}
      </div>
      {state.message ? <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p> : null}
    </form>
  );
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}
