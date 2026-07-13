"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/public/LanguageProvider";

type RoleOption = { id: string; name: string };
type UserRow = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  role: RoleOption;
};

export function UserManagement({
  users,
  roles,
  currentUserId
}: {
  users: UserRow[];
  roles: RoleOption[];
  currentUserId: string;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [managementError, setManagementError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (createOpen && !dialog.open) dialog.showModal();
    if (!createOpen && dialog.open) dialog.close();
  }, [createOpen]);

  function openCreateDialog() {
    setCreateError("");
    setCreateOpen(true);
  }

  function closeCreateDialog() {
    if (busy === "create") return;
    setCreateOpen(false);
    setCreateError("");
    requestAnimationFrame(() => createButtonRef.current?.focus());
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    setCreateError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        email: form.get("email") || null,
        displayName: form.get("displayName") || null,
        password: form.get("password"),
        roleId: form.get("roleId")
      })
    });
    const payload = await response.json().catch(() => null);
    setBusy("");
    if (!response.ok) {
      const fieldMessage = payload?.error?.fields
        ? Object.values(payload.error.fields).find((value): value is string => typeof value === "string")
        : null;
      setCreateError(fieldMessage ?? payload?.error?.message ?? t("admin.users.saveFailed"));
      return;
    }
    formElement.reset();
    setCreateOpen(false);
    router.refresh();
  }

  async function update(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setBusy(id);
    setManagementError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roleId: form.get("roleId"),
        status: form.get("status"),
        displayName: form.get("displayName") || null
      })
    });
    const payload = await response.json().catch(() => null);
    setBusy("");
    if (!response.ok) {
      setManagementError(payload?.error?.message ?? t("admin.users.saveFailed"));
      return;
    }
    router.refresh();
  }

  async function remove(id: string, username: string) {
    if (!window.confirm(t("admin.users.deleteConfirm", { username }))) return;
    setBusy(id);
    setManagementError("");
    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => null);
    setBusy("");
    if (!response.ok) {
      setManagementError(payload?.error?.message ?? t("admin.users.deleteFailed"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="user-management">
      <div className="admin-page-header user-management__header">
        <div>
          <h1>{t("admin.common.users")}</h1>
          <p className="message">{t("admin.users.intro")}</p>
        </div>
        <button ref={createButtonRef} className="button" type="button" onClick={openCreateDialog}>
          <UserPlus aria-hidden="true" size={18} />
          {t("admin.users.create")}
        </button>
      </div>

      {managementError ? <p className="message error" role="alert">{managementError}</p> : null}

      <section className="admin-panel user-management__panel" aria-labelledby="user-list-title">
        <div className="user-management__list-header">
          <div>
            <h2 id="user-list-title">{t("admin.users.listTitle")}</h2>
            <p>{t("admin.users.userCount", { count: users.length })}</p>
          </div>
          <UsersRound aria-hidden="true" size={22} />
        </div>

        <div className="table-scroll">
          <table className="table user-management__table">
            <thead>
              <tr>
                <th scope="col">{t("admin.common.username")}</th>
                <th scope="col">{t("admin.common.email")}</th>
                <th scope="col">{t("admin.users.displayName")}</th>
                <th scope="col">{t("admin.common.role")}</th>
                <th scope="col">{t("admin.common.status")}</th>
                <th scope="col">{t("admin.common.created")}</th>
                <th scope="col">{t("admin.common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.username}</strong>
                    {user.id === currentUserId ? <span className="table-secondary-line">{t("admin.users.you")}</span> : null}
                  </td>
                  <td>{user.email ?? "—"}</td>
                  <td colSpan={5}>
                    <form className="user-row-form" onSubmit={(event) => update(event, user.id)}>
                      <input name="displayName" defaultValue={user.displayName ?? ""} aria-label={t("admin.users.displayName")} />
                      <select name="roleId" defaultValue={user.role.id} aria-label={t("admin.common.role")}>
                        {roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}
                      </select>
                      <select name="status" defaultValue={user.status} aria-label={t("admin.common.status")}>
                        <option value="ACTIVE">{t("admin.status.ACTIVE")}</option>
                        <option value="DISABLED">{t("admin.status.DISABLED")}</option>
                      </select>
                      <time dateTime={user.createdAt}>{new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(new Date(user.createdAt))}</time>
                      <div className="row-actions">
                        <button className="button secondary compact" disabled={busy === user.id}>{t("admin.common.save")}</button>
                        <button className="button danger compact" type="button" disabled={busy === user.id || user.id === currentUserId} onClick={() => remove(user.id, user.username)}>{t("admin.common.delete")}</button>
                      </div>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        className="user-create-dialog"
        aria-labelledby="create-user-title"
        aria-describedby="create-user-description"
        onCancel={(event) => {
          event.preventDefault();
          closeCreateDialog();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          closeCreateDialog();
        }}
        onClose={() => setCreateOpen(false)}
        onMouseDown={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
          if (outside) closeCreateDialog();
        }}
      >
        <form className="user-create-dialog__form" onSubmit={create}>
          <header className="user-create-dialog__header">
            <div>
              <h2 id="create-user-title">{t("admin.users.create")}</h2>
              <p id="create-user-description">{t("admin.users.createDescription")}</p>
            </div>
            <button className="icon-button secondary" type="button" aria-label={t("admin.users.closeCreate")} disabled={busy === "create"} onClick={closeCreateDialog}>
              <X aria-hidden="true" size={20} />
            </button>
          </header>

          <div className="user-create-dialog__body">
            {createError ? <p className="message error" role="alert">{createError}</p> : null}
            <div className="form-grid user-create-grid">
              <div className="field">
                <label htmlFor="create-display-name">{t("admin.users.displayName")}</label>
                <input id="create-display-name" name="displayName" autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="create-username">{t("admin.common.username")}</label>
                <input id="create-username" name="username" autoComplete="username" required minLength={3} autoFocus />
              </div>
              <div className="field">
                <label htmlFor="create-email">{t("admin.common.email")}</label>
                <input id="create-email" name="email" type="email" autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="create-password">{t("admin.common.password")}</label>
                <input id="create-password" name="password" type="password" autoComplete="new-password" minLength={10} required />
                <small>{t("admin.users.passwordHint")}</small>
              </div>
              <div className="field user-create-grid__wide">
                <label htmlFor="create-role">{t("admin.common.role")}</label>
                <select id="create-role" name="roleId" required>
                  {roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <footer className="user-create-dialog__footer">
            <button className="button secondary" type="button" disabled={busy === "create"} onClick={closeCreateDialog}>{t("admin.common.cancel")}</button>
            <button className="button" disabled={busy === "create"}>
              <UserPlus aria-hidden="true" size={18} />
              {busy === "create" ? t("admin.common.saving") : t("admin.users.create")}
            </button>
          </footer>
        </form>
      </dialog>
    </div>
  );
}
