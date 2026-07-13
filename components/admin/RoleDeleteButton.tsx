"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/public/LanguageProvider";

export function RoleDeleteButton({ id, name }: { id: string; name: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm(t("admin.roles.deleteConfirm", { name }))) return;
    setBusy(true);
    const response = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      window.alert(payload?.error?.message ?? t("admin.roles.deleteFailed"));
      return;
    }
    router.refresh();
  }
  return <button className="button danger compact" type="button" disabled={busy} onClick={remove}>{busy ? t("admin.common.deleting") : t("admin.common.delete")}</button>;
}
