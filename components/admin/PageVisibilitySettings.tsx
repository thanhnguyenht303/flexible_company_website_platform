"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      setMessage(payload?.error?.message ?? "Could not update page visibility.");
      setSavingSlug(null);
      return;
    }

    setMessage("Page visibility updated.");
    setSavingSlug(null);
    router.refresh();
  }

  return (
    <div className="admin-panel">
      <h2>Public Page Visibility</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Path</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.slug}>
              <td>{page.title}</td>
              <td>{page.href}</td>
              <td>
                <span className="badge">{page.visible ? "Visible" : "Hidden"}</span>
              </td>
              <td>
                <button
                  className={page.visible ? "button danger" : "button"}
                  disabled={savingSlug === page.slug}
                  type="button"
                  onClick={() => setVisibility(page.slug, !page.visible)}
                >
                  {savingSlug === page.slug ? "Saving..." : page.visible ? "Hide" : "Show"}
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
