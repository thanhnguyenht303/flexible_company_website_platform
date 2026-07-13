"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/public/LanguageProvider";

type AuthorityOption = { id: string; key: string; name: string; group: string | null; description: string | null };
type RoleValue = { id: string; name: string; slug: string; description: string | null; isSystem: boolean; authorityKeys: string[] };

export function RoleForm({ authorities, role }: { authorities: AuthorityOption[]; role?: RoleValue }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [selected, setSelected] = useState<string[]>(role?.authorityKeys ?? []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const groups = useMemo(() => ["Workspace", "Content", "Admin"].map((group) => ({ group, authorities: authorities.filter((item) => item.group === group) })), [authorities]);
  const readOnly = Boolean(role?.isSystem);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(role ? `/api/admin/roles/${role.id}` : "/api/admin/roles", {
      method: role ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), slug: form.get("slug"), description: form.get("description"), authorityKeys: selected })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) return setError(payload?.error?.message ?? t("admin.roles.saveFailed"));
    router.push("/admin/roles");
    router.refresh();
  }

  return (
    <form className="admin-panel role-form" onSubmit={submit}>
      {readOnly ? <p className="message">{t("admin.roles.systemReadOnly")}</p> : null}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <div className="form-grid">
        <div className="field"><label htmlFor="role-name">{t("admin.roles.name")}</label><input id="role-name" name="name" defaultValue={role?.name} required disabled={readOnly} /></div>
        <div className="field"><label htmlFor="role-slug">{t("admin.roles.slug")}</label><input id="role-slug" name="slug" defaultValue={role?.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required disabled={readOnly} /></div>
        <div className="field form-grid__wide"><label htmlFor="role-description">{t("admin.roles.description")}</label><textarea id="role-description" name="description" defaultValue={role?.description ?? ""} disabled={readOnly} /></div>
      </div>
      <div className="role-form__heading">
        <h2>{t("admin.roles.authorities")}</h2>
        {!readOnly ? <div className="row-actions"><button className="button secondary compact" type="button" onClick={() => setSelected(authorities.map(({ key }) => key))}>{t("admin.roles.selectAll")}</button><button className="button secondary compact" type="button" onClick={() => setSelected([])}>{t("admin.roles.clearAll")}</button></div> : null}
      </div>
      <div className="authority-groups">
        {groups.map(({ group, authorities: options }) => <fieldset className="authority-group" key={group}><legend>{t(`admin.groups.${group.toLowerCase()}`)}</legend>{options.map((authority) => <label className="authority-option" key={authority.id}><input type="checkbox" checked={selected.includes(authority.key)} disabled={readOnly} onChange={(event) => setSelected((current) => event.target.checked ? [...current, authority.key] : current.filter((key) => key !== authority.key))} /><span><strong>{authority.name}</strong><small>{authority.description}</small></span></label>)}</fieldset>)}
      </div>
      <div className="form-actions"><button className="button" type="submit" disabled={saving || readOnly}>{saving ? t("admin.common.saving") : t("admin.roles.save")}</button></div>
    </form>
  );
}
