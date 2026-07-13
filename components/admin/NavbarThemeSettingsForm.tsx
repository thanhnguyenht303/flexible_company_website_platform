"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { defaultNavbarTheme, type NavbarTheme } from "@/lib/navbar-theme";

type SaveState = "idle" | "saving" | "saved" | "error";

const colorFields: Array<{ key: keyof NavbarTheme; labelKey: string; helpKey: string }> = [
  {
    key: "backgroundColor",
    labelKey: "admin.navbarTheme.backgroundColor",
    helpKey: "admin.navbarTheme.backgroundColorHelp"
  },
  {
    key: "textColor",
    labelKey: "admin.navbarTheme.textColor",
    helpKey: "admin.navbarTheme.textColorHelp"
  }
];

export function NavbarThemeSettingsForm({ theme }: { theme: NavbarTheme }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [values, setValues] = useState<NavbarTheme>(theme);
  const [draftText, setDraftText] = useState<Record<keyof NavbarTheme, string>>(theme);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage("");

    const response = await fetch("/api/admin/settings/navbar-theme", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState("error");
      setMessage(body?.error?.message ?? t("admin.messages.saveFailed"));
      return;
    }

    setState("saved");
    setMessage(t("admin.common.saved"));
    router.refresh();
  }

  function setColor(name: keyof NavbarTheme, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setDraftText((current) => ({ ...current, [name]: value }));
  }

  function setTextColor(name: keyof NavbarTheme, value: string) {
    setDraftText((current) => ({ ...current, [name]: value }));
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setValues((current) => ({ ...current, [name]: value }));
    }
  }

  function resetTheme() {
    setValues(defaultNavbarTheme);
    setDraftText(defaultNavbarTheme);
  }

  return (
    <form className="admin-panel navbar-theme-settings" onSubmit={submit}>
      <div className="navbar-theme-settings__header">
        <div>
          <p className="article-kicker">{t("admin.navbarTheme.kicker")}</p>
          <h2>{t("admin.navbarTheme.title")}</h2>
          <p className="message">{t("admin.navbarTheme.description")}</p>
        </div>
        <div className="navbar-theme-settings__actions">
          <button className="button secondary" type="button" onClick={resetTheme}>
            {t("admin.navbarTheme.reset")}
          </button>
          <button className="button" type="submit" disabled={state === "saving"}>
            <Save size={18} />
            {state === "saving" ? t("admin.common.saving") : t("admin.navbarTheme.save")}
          </button>
        </div>
      </div>

      <div className="navbar-theme-settings__layout">
        <div className="navbar-theme-settings__grid">
          {colorFields.map((field) => (
            <div className="field navbar-theme-settings__color" key={field.key}>
              <label htmlFor={`navbar-${field.key}`}>{t(field.labelKey)}</label>
              <div className="navbar-theme-settings__color-row">
                <input
                  id={`navbar-${field.key}`}
                  type="color"
                  value={values[field.key]}
                  onChange={(event) => setColor(field.key, event.target.value)}
                />
                <input
                  value={draftText[field.key]}
                  onChange={(event) => setTextColor(field.key, event.target.value)}
                  aria-label={t(field.labelKey)}
                />
              </div>
              <p className="field-help">{t(field.helpKey)}</p>
            </div>
          ))}
        </div>

        <div
          className="navbar-theme-settings__preview"
          style={{
            "--navbar-preview-background": values.backgroundColor,
            "--navbar-preview-text": values.textColor
          } as React.CSSProperties}
          aria-label={t("admin.navbarTheme.preview")}
        >
          <strong>{t("admin.navbarTheme.previewBrand")}</strong>
          <div className="navbar-theme-settings__preview-nav">
            <span>{t("nav.home")}</span>
            <span>{t("nav.services")}</span>
            <span>{t("nav.contact")}</span>
          </div>
        </div>
      </div>

      {state === "saved" || state === "error" ? (
        <p className={`message ${state === "error" ? "error" : ""}`}>{message}</p>
      ) : null}
    </form>
  );
}
