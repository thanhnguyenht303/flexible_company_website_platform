"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { defaultFooterTheme, type FooterTheme } from "@/lib/footer-theme";

type SaveState = "idle" | "saving" | "saved" | "error";

const colorFields: Array<{ key: keyof FooterTheme; labelKey: string; helpKey: string }> = [
  {
    key: "backgroundColor",
    labelKey: "admin.footerTheme.backgroundColor",
    helpKey: "admin.footerTheme.backgroundColorHelp"
  },
  {
    key: "textColor",
    labelKey: "admin.footerTheme.textColor",
    helpKey: "admin.footerTheme.textColorHelp"
  }
];

export function FooterThemeSettingsForm({ theme }: { theme: FooterTheme }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [values, setValues] = useState<FooterTheme>(theme);
  const [draftText, setDraftText] = useState<Record<keyof FooterTheme, string>>(theme);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage("");

    const response = await fetch("/api/admin/footer/theme", {
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

  function setColor(name: keyof FooterTheme, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setDraftText((current) => ({ ...current, [name]: value }));
  }

  function setTextColor(name: keyof FooterTheme, value: string) {
    setDraftText((current) => ({ ...current, [name]: value }));
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setValues((current) => ({ ...current, [name]: value }));
    }
  }

  function resetTheme() {
    setValues(defaultFooterTheme);
    setDraftText(defaultFooterTheme);
  }

  return (
    <form className="admin-panel footer-theme-settings" onSubmit={submit}>
      <div className="footer-theme-settings__header">
        <div>
          <p className="article-kicker">{t("admin.footerTheme.kicker")}</p>
          <h2>{t("admin.footerTheme.title")}</h2>
          <p className="message">{t("admin.footerTheme.description")}</p>
        </div>
        <div className="footer-theme-settings__actions">
          <button className="button secondary" type="button" onClick={resetTheme}>
            {t("admin.footerTheme.reset")}
          </button>
          <button className="button" type="submit" disabled={state === "saving"}>
            <Save size={18} />
            {state === "saving" ? t("admin.common.saving") : t("admin.footerTheme.save")}
          </button>
        </div>
      </div>

      <div className="footer-theme-settings__layout">
        <div className="footer-theme-settings__grid">
          {colorFields.map((field) => (
            <div className="field footer-theme-settings__color" key={field.key}>
              <label htmlFor={`footer-${field.key}`}>{t(field.labelKey)}</label>
              <div className="footer-theme-settings__color-row">
                <input
                  id={`footer-${field.key}`}
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
          className="footer-theme-settings__preview"
          style={{
            "--footer-preview-background": values.backgroundColor,
            "--footer-preview-text": values.textColor
          } as React.CSSProperties}
          aria-label={t("admin.footerTheme.preview")}
        >
          <div>
            <strong>{t("footer.collaboratorsTitle")}</strong>
            <p>{t("footer.collaboratorsText")}</p>
          </div>
          <div className="footer-theme-settings__preview-row">
            <span>{t("admin.common.company")}</span>
            <span>{t("admin.common.email")}</span>
            <span>{t("nav.privacy")}</span>
          </div>
        </div>
      </div>

      {state === "saved" || state === "error" ? (
        <p className={`message ${state === "error" ? "error" : ""}`}>{message}</p>
      ) : null}
    </form>
  );
}
