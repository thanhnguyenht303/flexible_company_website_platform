"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type ServiceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type ExistingServiceImage = {
  id: string;
  url: string;
  originalName: string;
};

type ServiceFormService = {
  id: string;
  name: string;
  nameVi: string | null;
  slug: string;
  summary: string | null;
  summaryVi: string | null;
  description: string | null;
  descriptionVi: string | null;
  status: ServiceStatus;
  imageId: string | null;
};

type ServiceFormProps = {
  service?: ServiceFormService;
  images?: ExistingServiceImage[];
};

type FormState = {
  status: "idle" | "saving" | "deleting" | "error";
  message: string;
};

export function ServiceForm({ service, images = [] }: ServiceFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const isEditing = Boolean(service);
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving", message: t("admin.messages.serviceSaved") });

    const payload = new FormData(event.currentTarget);
    const response = await fetch(isEditing ? `/api/admin/services/${service?.id}` : "/api/admin/services", {
      method: isEditing ? "PATCH" : "POST",
      body: payload
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? t("admin.messages.serviceSaveFailed")
      });
      return;
    }

    router.push("/admin/services");
    router.refresh();
  }

  async function onDelete() {
    if (!service) return;
    const confirmed = window.confirm(t("admin.confirm.deleteService", { title: service.name }));
    if (!confirmed) return;

    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? t("admin.messages.serviceDeleteFailed")
      });
      return;
    }

    router.push("/admin/services");
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" encType="multipart/form-data" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="name">{t("admin.forms.labels.title")}</label>
        <input id="name" name="name" required minLength={2} maxLength={180} defaultValue={service?.name ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="nameVi">{t("admin.forms.labels.titleVi")}</label>
        <input id="nameVi" name="nameVi" maxLength={180} defaultValue={service?.nameVi ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="slug">{t("admin.forms.labels.slug")}</label>
        <input
          id="slug"
          name="slug"
          placeholder={t("admin.forms.placeholders.autoSlug")}
          maxLength={220}
          defaultValue={service?.slug ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="summary">{t("admin.forms.labels.summary")}</label>
        <textarea id="summary" name="summary" maxLength={320} defaultValue={service?.summary ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="summaryVi">{t("admin.forms.labels.summaryVi")}</label>
        <textarea id="summaryVi" name="summaryVi" maxLength={320} defaultValue={service?.summaryVi ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="description">{t("admin.forms.labels.description")}</label>
        <textarea id="description" name="description" defaultValue={service?.description ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="descriptionVi">{t("admin.forms.labels.descriptionVi")}</label>
        <textarea id="descriptionVi" name="descriptionVi" defaultValue={service?.descriptionVi ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="status">{t("admin.forms.labels.status")}</label>
        <select id="status" name="status" defaultValue={service?.status ?? "DRAFT"}>
          <option value="DRAFT">{t("admin.status.DRAFT")}</option>
          <option value="PUBLISHED">{t("admin.status.PUBLISHED")}</option>
          <option value="ARCHIVED">{t("admin.status.ARCHIVED")}</option>
        </select>
      </div>

      {images.length ? (
        <div className="field">
          <label>{t("admin.forms.labels.existingImages")}</label>
          <div className="media-grid">
            {images.map((image) => (
              <label className="media-tile" key={image.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" />
                <span>{image.originalName}</span>
                <span>
                  <input type="checkbox" name="removeImageIds" value={image.id} /> {t("admin.common.remove")}
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="images">{t("admin.forms.labels.addServiceImages")}</label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
        />
        <p className="field-help">{t("admin.forms.help.serviceImages")}</p>
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? t("admin.common.saving") : t("admin.forms.buttons.saveService")}
        </button>
        {service ? (
          <button
            className="button danger"
            type="button"
            disabled={state.status === "deleting"}
            onClick={onDelete}
          >
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
