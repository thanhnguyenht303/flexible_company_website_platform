"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";
import type { PublicForm, PublicFormField } from "@/modules/forms/forms.types";

type DynamicFormProps = {
  form: PublicForm;
  titleOverride?: string;
  descriptionOverride?: string;
  submitLabel?: string;
  layout?: "stacked" | "two-column" | "compact";
  sourceType?: string;
  sourceId?: string;
  preview?: boolean;
};

type SubmitState = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
};

export function DynamicForm({
  form,
  titleOverride,
  descriptionOverride,
  submitLabel = "Submit",
  layout = "stacked",
  sourceType,
  sourceId,
  preview = false
}: DynamicFormProps) {
  const { t } = useLanguage();
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) return;
    setState({ status: "submitting", message: "" });
    const element = event.currentTarget;
    const payload = new FormData(element);
    if (sourceType) payload.set("_sourceType", sourceType);
    if (sourceId) payload.set("_sourceId", sourceId);

    const response = await fetch(`/api/public/forms/${form.slug}/submissions`, {
      method: "POST",
      body: payload
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const fields = body?.error?.fields ? Object.values(body.error.fields).join(" ") : "";
      setState({
        status: "error",
        message: fields || body?.error?.message || t("formsFeature.publicForm.error")
      });
      return;
    }

    const redirectUrl = body?.data?.redirectUrl;
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    element.reset();
    setState({
      status: "success",
      message:
        body?.data?.message ||
        form.successMessage ||
        (form.sourceType === "qa" ? t("formsFeature.publicForm.questionSuccess") : t("formsFeature.publicForm.success"))
    });
  }

  return (
    <form className={`dynamic-form dynamic-form--${layout}`} onSubmit={onSubmit}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />
      <div className="dynamic-form__header">
        <h2>{titleOverride || form.name}</h2>
        {(descriptionOverride || form.description) ? <p>{descriptionOverride || form.description}</p> : null}
      </div>
      <div className="dynamic-form__fields">
        {form.fields.map((field) => (
          <DynamicField field={field} key={field.id} />
        ))}
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "submitting" || preview}>
          {state.status === "submitting" ? t("formsFeature.publicForm.submitting") : submitLabel || t("formsFeature.publicForm.submit")}
        </button>
      </div>
      {state.message ? <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p> : null}
    </form>
  );
}

function DynamicField({ field }: { field: PublicFormField }) {
  const { t } = useLanguage();
  if (field.type === "hidden") {
    return <input type="hidden" name={field.key} defaultValue={field.defaultValue ?? ""} />;
  }

  if (field.type === "checkbox" || field.type === "consent") {
    return (
      <label className="checkbox-field dynamic-form__checkbox">
        <input type="checkbox" name={field.key} required={field.required} defaultChecked={field.defaultValue === "true"} />
        <span>
          {field.label}
          {field.required ? ` (${t("formsFeature.publicForm.required")})` : ""}
          {field.helpText ? <small>{field.helpText}</small> : null}
        </span>
      </label>
    );
  }

  return (
    <div className="field">
      <label htmlFor={`form-${field.id}`}>
        {field.label}
        {field.required ? <span className="required-marker" aria-label={t("formsFeature.publicForm.required")}> *</span> : ""}
      </label>
      {renderInput(field, t("formsFeature.publicForm.selectOption"))}
      {field.helpText ? <p className="field-help">{field.helpText}</p> : null}
    </div>
  );
}

function renderInput(field: PublicFormField, selectOptionLabel: string) {
  const common = {
    id: `form-${field.id}`,
    name: field.key,
    required: field.required,
    placeholder: field.placeholder ?? undefined,
    defaultValue: field.defaultValue ?? ""
  };

  if (field.type === "textarea") return <textarea {...common} />;
  if (field.type === "select") {
    return (
      <select {...common}>
        <option value="">{selectOptionLabel}</option>
        {(field.options ?? []).map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "radio") {
    return (
      <div className="dynamic-form__choice-list">
        {(field.options ?? []).map((option) => (
          <label className="checkbox-field" key={option.value}>
            <input type="radio" name={field.key} value={option.value} required={field.required} />
            {option.label}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "checkboxGroup") {
    return (
      <div className="dynamic-form__choice-list">
        {(field.options ?? []).map((option) => (
          <label className="checkbox-field" key={option.value}>
            <input type="checkbox" name={field.key} value={option.value} />
            {option.label}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "file") {
    return (
      <label className="dynamic-form__file" htmlFor={common.id}>
        <Upload size={18} />
        <span>{field.placeholder || field.label}</span>
        <input id={common.id} name={common.name} type="file" required={common.required} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
      </label>
    );
  }
  if (field.type === "email") return <input {...common} type="email" />;
  if (field.type === "phone") return <input {...common} type="tel" />;
  if (field.type === "number") return <input {...common} type="number" />;
  if (field.type === "date") return <input {...common} type="date" />;
  if (field.type === "time") return <input {...common} type="time" />;
  if (field.type === "url") return <input {...common} type="url" />;
  return <input {...common} type="text" />;
}
