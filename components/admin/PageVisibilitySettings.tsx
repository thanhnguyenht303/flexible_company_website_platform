"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/public/LanguageProvider";

type PageVisibilitySettingsProps = {
  pages: Array<{
    slug: string;
    title: string;
    href: string;
    visible: boolean;
  }>;
};

export function PageVisibilitySettings({ pages }: PageVisibilitySettingsProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function setVisibility(slug: string, visible: boolean) {
    setSavingSlug(slug);
    setMessage(null);

    const response = await fetch(`/api/admin/pages/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
      setMessage(payload?.error?.message ?? t("admin.pages.visibilityFailed"));
      setSavingSlug(null);
      return;
    }

    setMessage(t("admin.pages.visibilityUpdated"));
    setSavingSlug(null);
    router.refresh();
  }

  return (
    <div className="admin-panel">
      <h2>{t("admin.pages.publicVisibility")}</h2>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">{t("admin.common.page")}</th>
            <th scope="col">{t("admin.common.path")}</th>
            <th scope="col">{t("admin.common.status")}</th>
            <th scope="col">{t("admin.common.action")}</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.slug}>
              <td>{page.title}</td>
              <td>{page.href}</td>
              <td>
                <span className="badge">{page.visible ? t("admin.common.visible") : t("admin.common.hidden")}</span>
              </td>
              <td>
                <button
                  className={page.visible ? "button danger" : "button"}
                  disabled={savingSlug === page.slug}
                  type="button"
                  onClick={() => setVisibility(page.slug, !page.visible)}
                >
                  {savingSlug === page.slug ? t("admin.common.saving") : page.visible ? t("admin.pages.hide") : t("admin.pages.show")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {message ? <p className="message">{message}</p> : null}
    </div>
  );
}
