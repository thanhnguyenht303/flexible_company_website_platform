"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { DynamicForm } from "@/components/public/DynamicForm";
import { fieldTypeLabel, statusLabel } from "@/modules/forms/forms.labels";
import { formFieldTypes, type FormFieldType } from "@/modules/forms/forms.types";
import type { PublicForm } from "@/modules/forms/forms.types";

type FormStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type FieldState = {
  id?: string;
  type: FormFieldType;
  label: string;
  key: string;
  helpText?: string | null;
  placeholder?: string | null;
  required: boolean;
  optionsText: string;
  defaultValue?: string | null;
  sortOrder: number;
};

type FormBuilderValue = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: FormStatus;
  successMessage: string | null;
  redirectUrl: string | null;
  notificationEmails: string[];
  sourceType: string;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    key: string;
    helpText: string | null;
    placeholder: string | null;
    required: boolean;
    options: unknown;
    defaultValue: string | null;
    sortOrder: number;
  }>;
};

type FormState = {
  status: "idle" | "saving" | "deleting" | "error";
  message: string;
};

const defaultFields: FieldState[] = [
  { type: "text", label: "Name", key: "name", required: true, optionsText: "", sortOrder: 0 },
  { type: "email", label: "Email", key: "email", required: true, optionsText: "", sortOrder: 1 },
  { type: "textarea", label: "Message", key: "message", required: true, optionsText: "", sortOrder: 2 }
];

export function FormBuilderForm({ form }: { form?: FormBuilderValue }) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isEditing = Boolean(form);
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });
  const [fields, setFields] = useState<FieldState[]>(() => (form ? form.fields.map(toFieldState) : defaultFields));

  const fieldCountLabel = useMemo(() => `${fields.length} ${t("formsFeature.forms.fields").toLowerCase()}`, [fields.length, t]);
  const previewForm: PublicForm = {
    id: form?.id ?? "preview",
    name: form?.name || t("formsFeature.forms.newForm"),
    slug: form?.slug || "preview",
    description: null,
    sourceType: form?.sourceType ?? "form",
    fields: fields.map((field, index) => ({
      id: field.id ?? `preview-${index}`,
      type: field.type,
      label: field.label || t("formsFeature.fields.untitled"),
      key: field.key || `field${index + 1}`,
      helpText: field.helpText,
      placeholder: field.placeholder,
      required: field.required,
      options: parseOptions(field.optionsText),
      defaultValue: field.defaultValue,
      sortOrder: index
    }))
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: emptyToNull(formData.get("description")),
      status: String(formData.get("status") ?? "DRAFT"),
      successMessage: emptyToNull(formData.get("successMessage")),
      redirectUrl: emptyToNull(formData.get("redirectUrl")),
      notificationEmails: splitEmails(String(formData.get("notificationEmails") ?? "")),
      sourceType: String(formData.get("sourceType") ?? "form"),
      linkedEntityType: emptyToNull(formData.get("linkedEntityType")),
      linkedEntityId: emptyToNull(formData.get("linkedEntityId")),
      fields: fields.map((field, index) => ({
        id: field.id,
        type: field.type,
        label: field.label,
        key: field.key,
        helpText: field.helpText || null,
        placeholder: field.placeholder || null,
        required: field.required,
        options: parseOptions(field.optionsText),
        defaultValue: field.defaultValue || null,
        sortOrder: index
      }))
    };

    setState({ status: "saving", message: "" });
    const response = await fetch(isEditing ? `/api/admin/forms/${form?.id}` : "/api/admin/forms", {
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

    router.push("/admin/forms");
    router.refresh();
  }

  async function onDelete() {
    if (!form) return;
    if (!window.confirm(`${t("formsFeature.common.delete")} "${form.name}"?`)) return;
    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/forms/${form.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({ status: "error", message: body?.error?.message || t("formsFeature.publicForm.error") });
      return;
    }
    router.push("/admin/forms");
    router.refresh();
  }

  function updateField(index: number, patch: Partial<FieldState>) {
    setFields((current) => current.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)));
  }

  function addField() {
    const nextIndex = fields.length + 1;
    setFields((current) => [
      ...current,
      { type: "text", label: `Field ${nextIndex}`, key: `field${nextIndex}`, required: false, optionsText: "", sortOrder: current.length }
    ]);
  }

  function removeField(index: number) {
    setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index));
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setFields((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form className="form-builder-admin" onSubmit={onSubmit}>
      <div className="form-builder-layout">
        <section className="admin-panel form-builder-main">
          <div className="section-heading">
            <div>
              <h2>{t("formsFeature.forms.fields")}</h2>
              <p>{fieldCountLabel}</p>
            </div>
            <button className="button secondary" type="button" onClick={addField}>
              <Plus size={17} />
              {t("formsFeature.forms.addField")}
            </button>
          </div>
          <div className="form-field-builder">
            {fields.map((field, index) => (
              <div className="form-field-builder__item" key={`${field.id ?? "new"}-${index}`}>
                <div className="form-field-builder__item-head">
                  <div className="form-field-builder__title">
                    <GripVertical size={17} aria-hidden="true" />
                    <strong>{field.label || t("formsFeature.fields.untitled")}</strong>
                    <span className="badge badge--neutral">{fieldTypeLabel(language, field.type)}</span>
                    {field.required ? <span className="badge badge--warning">{t("formsFeature.fields.required")}</span> : null}
                  </div>
                  <div className="row-actions">
                    <button className="button secondary" type="button" disabled={index === 0} onClick={() => moveField(index, -1)}>
                      {t("formsFeature.fields.up")}
                    </button>
                    <button className="button secondary" type="button" disabled={index === fields.length - 1} onClick={() => moveField(index, 1)}>
                      {t("formsFeature.fields.down")}
                    </button>
                    <button className="button danger" type="button" aria-label={t("formsFeature.common.delete")} onClick={() => removeField(index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor={`field-type-${index}`}>{t("formsFeature.fields.type")}</label>
                    <select id={`field-type-${index}`} value={field.type} onChange={(event) => updateField(index, { type: event.target.value as FormFieldType })}>
                      {formFieldTypes.map((type) => (
                        <option value={type} key={type}>{fieldTypeLabel(language, type)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`field-label-${index}`}>{t("formsFeature.fields.label")}</label>
                    <input id={`field-label-${index}`} value={field.label} maxLength={180} onChange={(event) => updateField(index, { label: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`field-key-${index}`}>{t("formsFeature.fields.key")}</label>
                    <input id={`field-key-${index}`} value={field.key} maxLength={80} onChange={(event) => updateField(index, { key: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`field-placeholder-${index}`}>{t("formsFeature.fields.placeholder")}</label>
                    <input id={`field-placeholder-${index}`} value={field.placeholder ?? ""} maxLength={180} onChange={(event) => updateField(index, { placeholder: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`field-help-${index}`}>{t("formsFeature.fields.helpText")}</label>
                    <input id={`field-help-${index}`} value={field.helpText ?? ""} maxLength={500} onChange={(event) => updateField(index, { helpText: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`field-default-${index}`}>{t("formsFeature.fields.defaultValue")}</label>
                    <input id={`field-default-${index}`} value={field.defaultValue ?? ""} maxLength={500} onChange={(event) => updateField(index, { defaultValue: event.target.value })} />
                  </div>
                  <div className="field form-grid__wide">
                    <label htmlFor={`field-options-${index}`}>{t("formsFeature.fields.options")}</label>
                    <textarea id={`field-options-${index}`} value={field.optionsText} onChange={(event) => updateField(index, { optionsText: event.target.value })} placeholder={t("formsFeature.fields.optionsHelp")} />
                    <p className="field-help">{t("formsFeature.fields.usedByOptions")}</p>
                  </div>
                  <label className="checkbox-field">
                    <input checked={field.required} type="checkbox" onChange={(event) => updateField(index, { required: event.target.checked })} />
                    {t("formsFeature.fields.required")}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="form-builder-sidebar">
          <section className="admin-panel form-grid">
            <h2>{t("formsFeature.common.formBuilder")}</h2>
            <div className="field">
              <label htmlFor="name">{t("formsFeature.forms.name")}</label>
        <input id="name" name="name" required minLength={2} maxLength={180} defaultValue={form?.name ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="slug">{t("formsFeature.forms.slug")}</label>
        <input id="slug" name="slug" maxLength={220} placeholder="auto-generated-from-name" defaultValue={form?.slug ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="status">{t("formsFeature.common.status")}</label>
        <select id="status" name="status" defaultValue={form?.status ?? "DRAFT"}>
          <option value="DRAFT">{statusLabel(language, "DRAFT")}</option>
          <option value="PUBLISHED">{statusLabel(language, "PUBLISHED")}</option>
          <option value="ARCHIVED">{statusLabel(language, "ARCHIVED")}</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="sourceType">{t("formsFeature.common.sourceType")}</label>
        <input id="sourceType" name="sourceType" defaultValue={form?.sourceType ?? "form"} />
        <p className="field-help">{t("formsFeature.forms.sourceHelp")}</p>
      </div>
      <div className="field form-grid__wide">
        <label htmlFor="description">{t("formsFeature.forms.descriptionLabel")}</label>
        <textarea id="description" name="description" maxLength={1000} defaultValue={form?.description ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="successMessage">{t("formsFeature.forms.successMessage")}</label>
        <textarea id="successMessage" name="successMessage" maxLength={500} defaultValue={form?.successMessage ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="redirectUrl">{t("formsFeature.forms.redirectUrl")}</label>
        <input id="redirectUrl" name="redirectUrl" maxLength={500} defaultValue={form?.redirectUrl ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="notificationEmails">{t("formsFeature.forms.notificationEmails")}</label>
        <input id="notificationEmails" name="notificationEmails" defaultValue={form?.notificationEmails.join(", ") ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="linkedEntityType">{t("formsFeature.forms.linkedEntityType")}</label>
        <input id="linkedEntityType" name="linkedEntityType" maxLength={80} defaultValue={form?.linkedEntityType ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="linkedEntityId">{t("formsFeature.forms.linkedEntityId")}</label>
        <input id="linkedEntityId" name="linkedEntityId" maxLength={180} defaultValue={form?.linkedEntityId ?? ""} />
      </div>
          </section>
          <section className="admin-panel">
            <h2>{t("admin.common.preview")}</h2>
            <DynamicForm form={previewForm} submitLabel={t("formsFeature.publicForm.submit")} preview />
          </section>
        </aside>
      </div>
      <div className="form-actions form-builder-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? t("admin.common.saving") : t("formsFeature.forms.saveForm")}
        </button>
        {form ? (
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

function toFieldState(field: FormBuilderValue["fields"][number]): FieldState {
  return {
    id: field.id,
    type: formFieldTypes.includes(field.type as FormFieldType) ? (field.type as FormFieldType) : "text",
    label: field.label,
    key: field.key,
    helpText: field.helpText,
    placeholder: field.placeholder,
    required: field.required,
    optionsText: stringifyOptions(field.options),
    defaultValue: field.defaultValue,
    sortOrder: field.sortOrder
  };
}

function stringifyOptions(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const label = typeof record.label === "string" ? record.label : "";
        const optionValue = typeof record.value === "string" ? record.value : label;
        return label === optionValue ? label : `${label} | ${optionValue}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function parseOptions(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, value] = line.split("|").map((part) => part.trim());
      return { label, value: value || label };
    });
}

function splitEmails(value: string) {
  return value
    .split(/[,;\s]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}
