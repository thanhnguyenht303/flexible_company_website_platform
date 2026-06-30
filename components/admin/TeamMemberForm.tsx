"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";

type TeamMemberFormMember = {
  id: string;
  name: string;
  position: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  sortOrder: number;
  isVisible: boolean;
  photoId: string | null;
};

type TeamMemberFormProps = {
  member?: TeamMemberFormMember;
};

type FormState = {
  status: "idle" | "saving" | "deleting" | "error";
  message: string;
};

export function TeamMemberForm({ member }: TeamMemberFormProps) {
  const router = useRouter();
  const isEditing = Boolean(member);
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving", message: "Saving employee." });

    const payload = new FormData(event.currentTarget);
    const response = await fetch(isEditing ? `/api/admin/team/${member?.id}` : "/api/admin/team", {
      method: isEditing ? "PATCH" : "POST",
      body: payload
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? "Employee could not be saved."
      });
      return;
    }

    router.push("/admin/team");
    router.refresh();
  }

  async function onDelete() {
    if (!member) return;
    const confirmed = window.confirm(`Delete "${member.name}"? This will also delete the employee photo.`);
    if (!confirmed) return;

    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/team/${member.id}`, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? "Employee could not be deleted."
      });
      return;
    }

    router.push("/admin/team");
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" encType="multipart/form-data" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required minLength={2} maxLength={160} defaultValue={member?.name ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="position">Position</label>
        <input id="position" name="position" maxLength={160} defaultValue={member?.position ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="bio">Description</label>
        <textarea id="bio" name="bio" maxLength={2000} defaultValue={member?.bio ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" defaultValue={member?.email ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" maxLength={80} defaultValue={member?.phone ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="sortOrder">Sort Order</label>
        <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={member?.sortOrder ?? 0} />
      </div>
      <div className="field">
        <label htmlFor="isVisible">Visibility</label>
        <select id="isVisible" name="isVisible" defaultValue={String(member?.isVisible ?? true)}>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="photo">Employee Image</label>
        {member?.photoId ? (
          <div className="employee-photo-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${member.photoId}`} alt="" />
          </div>
        ) : null}
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
        <p className="field-help">Recommended: square portrait image. Uploading a new image replaces the old one.</p>
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? "Saving" : "Save Employee"}
        </button>
        {member ? (
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
