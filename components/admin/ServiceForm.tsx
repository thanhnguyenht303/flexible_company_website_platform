"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";

type ServiceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type ExistingServiceImage = {
  id: string;
  url: string;
  originalName: string;
};

type ServiceFormService = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
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
  const isEditing = Boolean(service);
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving", message: "Saving service." });

    const payload = new FormData(event.currentTarget);
    const response = await fetch(isEditing ? `/api/admin/services/${service?.id}` : "/api/admin/services", {
      method: isEditing ? "PATCH" : "POST",
      body: payload
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? "Service could not be saved."
      });
      return;
    }

    router.push("/admin/services");
    router.refresh();
  }

  async function onDelete() {
    if (!service) return;
    const confirmed = window.confirm(`Delete "${service.name}"? This will also delete its images.`);
    if (!confirmed) return;

    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? "Service could not be deleted."
      });
      return;
    }

    router.push("/admin/services");
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" encType="multipart/form-data" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="name">Title</label>
        <input id="name" name="name" required minLength={2} maxLength={180} defaultValue={service?.name ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          placeholder="auto-generated from title if blank"
          maxLength={220}
          defaultValue={service?.slug ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="summary">Summary</label>
        <textarea id="summary" name="summary" maxLength={320} defaultValue={service?.summary ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={service?.description ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={service?.status ?? "DRAFT"}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {images.length ? (
        <div className="field">
          <label>Existing Images</label>
          <div className="media-grid">
            {images.map((image) => (
              <label className="media-tile" key={image.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" />
                <span>{image.originalName}</span>
                <span>
                  <input type="checkbox" name="removeImageIds" value={image.id} /> Remove
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="images">Add Service Images</label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
        />
        <p className="field-help">Upload one or more service images. The first saved image becomes the service thumbnail.</p>
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? "Saving" : "Save Service"}
        </button>
        {service ? (
          <button
            className="button danger"
            type="button"
            disabled={state.status === "deleting"}
            onClick={onDelete}
          >
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
