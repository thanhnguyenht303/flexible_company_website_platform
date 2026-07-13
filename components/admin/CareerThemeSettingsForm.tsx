"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { defaultCareerTheme, type CareerTheme } from "@/lib/career-theme";

type SaveState = "idle" | "saving" | "saved" | "error";
type CareerThemeKey = Exclude<keyof CareerTheme, "backgroundImageId">;

const colorFields: Array<{ key: CareerThemeKey; helpKey: string }> = [
  { key: "primaryColor", helpKey: "admin.careers.primaryColorHelp" },
  { key: "accentColor", helpKey: "admin.careers.accentColorHelp" },
  { key: "backgroundColor", helpKey: "admin.careers.backgroundColorHelp" },
  { key: "textColor", helpKey: "admin.careers.textColorHelp" }
];

const presets: Array<{ key: string; labelKey: string; theme: CareerTheme }> = [
  {
    key: "blue",
    labelKey: "admin.careers.presetBlue",
    theme: defaultCareerTheme
  },
  {
    key: "green",
    labelKey: "admin.careers.presetGreen",
    theme: {
      primaryColor: "#047857",
      accentColor: "#2563EB",
      backgroundColor: "#ECFDF5",
      textColor: "#064E3B",
      backgroundImageId: null
    }
  },
  {
    key: "slate",
    labelKey: "admin.careers.presetSlate",
    theme: {
      primaryColor: "#334155",
      accentColor: "#0EA5E9",
      backgroundColor: "#F8FAFC",
      textColor: "#0F172A",
      backgroundImageId: null
    }
  }
];

export function CareerThemeSettingsForm({ theme }: { theme: CareerTheme }) {
  const router = useRouter();
  const { t } = useLanguage();
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<CareerTheme>(theme);
  const [draftText, setDraftText] = useState<Record<CareerThemeKey, string>>(getColorDraft(theme));
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState(theme.backgroundImageId ? `/api/media/${theme.backgroundImageId}` : "");
  const [hasSavedBackgroundImage, setHasSavedBackgroundImage] = useState(Boolean(theme.backgroundImageId));
  const [removeBackgroundImage, setRemoveBackgroundImage] = useState(false);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const previewStyle = useMemo(
    () =>
      ({
        "--career-preview-primary": values.primaryColor,
        "--career-preview-accent": values.accentColor,
        "--career-preview-background": values.backgroundColor,
        "--career-preview-text": values.textColor,
        "--career-preview-background-image": backgroundPreviewUrl ? `url("${backgroundPreviewUrl}")` : "none",
        "--career-preview-background-overlay": backgroundPreviewUrl ? "rgb(255 255 255 / 0.32)" : "transparent"
      }) as CSSProperties,
    [backgroundPreviewUrl, values]
  );

  useEffect(() => {
    return () => {
      if (backgroundPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(backgroundPreviewUrl);
    };
  }, [backgroundPreviewUrl]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage("");

    const payload = new FormData();
    payload.set("primaryColor", values.primaryColor);
    payload.set("accentColor", values.accentColor);
    payload.set("backgroundColor", values.backgroundColor);
    payload.set("textColor", values.textColor);
    if (backgroundFile) payload.set("backgroundImage", backgroundFile);
    if (removeBackgroundImage) payload.set("removeBackgroundImage", "true");

    const response = await fetch("/api/admin/careers/theme", {
      method: "PUT",
      body: payload
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState("error");
      setMessage(body?.error?.message ?? t("admin.messages.saveFailed"));
      return;
    }

    setState("saved");
    setMessage(t("admin.common.saved"));
    setHasSavedBackgroundImage(Boolean(backgroundPreviewUrl));
    setBackgroundFile(null);
    setRemoveBackgroundImage(false);
    router.refresh();
  }

  function setColor(name: CareerThemeKey, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setDraftText((current) => ({ ...current, [name]: value }));
    setState("idle");
    setMessage("");
  }

  function setTextColor(name: CareerThemeKey, value: string) {
    setDraftText((current) => ({ ...current, [name]: value }));
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setValues((current) => ({ ...current, [name]: value }));
      setState("idle");
      setMessage("");
    }
  }

  function applyPreset(nextTheme: CareerTheme) {
    setValues((current) => ({ ...current, ...nextTheme, backgroundImageId: current.backgroundImageId }));
    setDraftText(getColorDraft(nextTheme));
    setState("idle");
    setMessage("");
  }

  function onBackgroundChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBackgroundPreviewUrl((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setBackgroundFile(file);
    setRemoveBackgroundImage(false);
    setState("idle");
    setMessage("");
  }

  function clearBackgroundImage() {
    setBackgroundPreviewUrl((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return "";
    });
    setBackgroundFile(null);
    setRemoveBackgroundImage(hasSavedBackgroundImage);
    if (backgroundInputRef.current) backgroundInputRef.current.value = "";
    setState("idle");
    setMessage("");
  }

  return (
    <form className="admin-panel career-admin-theme" encType="multipart/form-data" onSubmit={submit}>
      <div className="career-admin-theme__header">
        <div>
          <p className="article-kicker">{t("admin.careers.themeKicker")}</p>
          <h2>{t("admin.careers.themeTitle")}</h2>
          <p className="message">{t("admin.careers.themeDescription")}</p>
        </div>
        <div className="career-admin-theme__actions">
          <button className="button secondary" type="button" onClick={() => applyPreset(defaultCareerTheme)}>
            <RotateCcw size={18} />
            {t("admin.careers.resetTheme")}
          </button>
          <button className="button" type="submit" disabled={state === "saving"}>
            <Save size={18} />
            {state === "saving" ? t("admin.common.saving") : t("admin.careers.saveTheme")}
          </button>
        </div>
      </div>

      <div className="career-admin-theme__layout">
        <section className="career-admin-theme__controls" aria-label={t("admin.careers.themeControls")}>
          <div className="career-admin-theme__presets" aria-label={t("admin.careers.presets")}>
            {presets.map((preset) => (
              <button className="career-admin-theme__preset" type="button" key={preset.key} onClick={() => applyPreset(preset.theme)}>
                <span className="career-admin-theme__preset-swatches" aria-hidden="true">
                  <span style={{ background: preset.theme.primaryColor }} />
                  <span style={{ background: preset.theme.accentColor }} />
                  <span style={{ background: preset.theme.backgroundColor }} />
                </span>
                {t(preset.labelKey)}
              </button>
            ))}
          </div>

          <div className="career-admin-theme__grid">
            {colorFields.map((field) => (
              <div className="career-admin-theme__color" key={field.key}>
                <label htmlFor={`career-${field.key}`}>{t(`admin.careers.${field.key}`)}</label>
                <div className="career-admin-theme__color-row">
                  <input
                    id={`career-${field.key}`}
                    aria-label={t(`admin.careers.${field.key}`)}
                    type="color"
                    value={values[field.key]}
                    onChange={(event) => setColor(field.key, event.target.value)}
                  />
                  <input
                    aria-label={`${t(`admin.careers.${field.key}`)} hex`}
                    type="text"
                    inputMode="text"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    value={draftText[field.key]}
                    onChange={(event) => setTextColor(field.key, event.target.value)}
                  />
                </div>
                <p>{t(field.helpKey)}</p>
              </div>
            ))}
          </div>

          <div className="career-admin-theme__background">
            <div>
              <label htmlFor="career-background-image">{t("admin.careers.backgroundImage")}</label>
              <p>{t("admin.careers.backgroundImageHelp")}</p>
            </div>
            {backgroundPreviewUrl ? (
              <div className="career-admin-theme__background-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={backgroundPreviewUrl} alt="" />
              </div>
            ) : null}
            <div className="career-admin-theme__background-actions">
              <input
                ref={backgroundInputRef}
                id="career-background-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onBackgroundChange}
              />
              {backgroundPreviewUrl ? (
                <button className="button danger" type="button" disabled={state === "saving"} onClick={clearBackgroundImage}>
                  {t("admin.careers.removeBackgroundImage")}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="career-admin-theme__preview" style={previewStyle} aria-label={t("admin.careers.preview")}>
          <div className="career-admin-theme__preview-hero">
            <span>{t("admin.careers.previewKicker")}</span>
            <strong>{t("pages.careers.title")}</strong>
            <p>{t("pages.careers.description")}</p>
            <button type="button">{t("pages.careers.viewRole")}</button>
          </div>
          <div className="career-admin-theme__preview-card">
            <span>{t("pages.careers.featuredRole")}</span>
            <strong>{t("admin.careers.previewRole")}</strong>
            <p>{t("admin.careers.previewRoleText")}</p>
            <div>
              <small>{t("admin.forms.options.remote")}</small>
              <small>{t("admin.forms.options.fullTime")}</small>
            </div>
          </div>
        </aside>
      </div>

      {message ? <p className={`message ${state === "error" ? "error" : ""}`}>{message}</p> : null}
    </form>
  );
}

function getColorDraft(theme: CareerTheme): Record<CareerThemeKey, string> {
  return {
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor
  };
}
