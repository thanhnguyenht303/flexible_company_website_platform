"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type TeamMemberFormMember = {
  id: string;
  name: string;
  position: string | null;
  positionVi: string | null;
  bio: string | null;
  bioVi: string | null;
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
  const { t } = useLanguage();
  const isEditing = Boolean(member);
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving", message: t("admin.messages.employeeSaving") });

    const payload = new FormData(event.currentTarget);
    const response = await fetch(isEditing ? `/api/admin/team/${member?.id}` : "/api/admin/team", {
      method: isEditing ? "PATCH" : "POST",
      body: payload
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? t("admin.messages.employeeSaveFailed")
      });
      return;
    }

    router.push("/admin/team");
    router.refresh();
  }

  async function onDelete() {
    if (!member) return;
    const confirmed = window.confirm(t("admin.confirm.deleteEmployee", { title: member.name }));
    if (!confirmed) return;

    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/team/${member.id}`, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? t("admin.messages.employeeDeleteFailed")
      });
      return;
    }

    router.push("/admin/team");
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" encType="multipart/form-data" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="name">{t("admin.forms.labels.name")}</label>
        <input id="name" name="name" required minLength={2} maxLength={160} defaultValue={member?.name ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="position">{t("admin.forms.labels.position")}</label>
        <input id="position" name="position" maxLength={160} defaultValue={member?.position ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="positionVi">{t("admin.forms.labels.positionVi")}</label>
        <input id="positionVi" name="positionVi" maxLength={160} defaultValue={member?.positionVi ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="bio">{t("admin.forms.labels.description")}</label>
        <textarea id="bio" name="bio" maxLength={2000} defaultValue={member?.bio ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="bioVi">{t("admin.forms.labels.descriptionVi")}</label>
        <textarea id="bioVi" name="bioVi" maxLength={2000} defaultValue={member?.bioVi ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="email">{t("admin.forms.labels.email")}</label>
        <input id="email" name="email" type="email" defaultValue={member?.email ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="phone">{t("admin.forms.labels.phone")}</label>
        <input id="phone" name="phone" maxLength={80} defaultValue={member?.phone ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="sortOrder">{t("admin.common.sortOrder")}</label>
        <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={member?.sortOrder ?? 0} />
      </div>
      <div className="field">
        <label htmlFor="isVisible">{t("admin.forms.labels.visibility")}</label>
        <select id="isVisible" name="isVisible" defaultValue={String(member?.isVisible ?? true)}>
          <option value="true">{t("admin.common.visible")}</option>
          <option value="false">{t("admin.common.hidden")}</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="photo">{t("admin.forms.labels.employeeImage")}</label>
        {member?.photoId ? (
          <div className="employee-photo-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${member.photoId}`} alt="" />
          </div>
        ) : null}
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
        <p className="field-help">{t("admin.forms.help.employeeImage")}</p>
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? t("admin.common.saving") : t("admin.forms.buttons.saveEmployee")}
        </button>
        {member ? (
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
