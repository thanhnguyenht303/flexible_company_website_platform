"use client";

import { RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { defaultQaTheme, type QaTheme } from "@/lib/qa-theme";

type SaveState = "idle" | "saving" | "saved" | "error";
type QaThemeKey = Exclude<keyof QaTheme, "backgroundImageId">;

const colorFields: Array<{ key: QaThemeKey; helpKey: string }> = [
  { key: "primaryColor", helpKey: "admin.qaTheme.primaryColorHelp" },
  { key: "accentColor", helpKey: "admin.qaTheme.accentColorHelp" },
  { key: "backgroundColor", helpKey: "admin.qaTheme.backgroundColorHelp" },
  { key: "textColor", helpKey: "admin.qaTheme.textColorHelp" }
];

const presets: Array<{ key: string; labelKey: string; theme: QaTheme }> = [
  {
    key: "blue",
    labelKey: "admin.qaTheme.presetBlue",
    theme: defaultQaTheme
  },
  {
    key: "slate",
    labelKey: "admin.qaTheme.presetSlate",
    theme: {
      primaryColor: "#475569",
      accentColor: "#2563EB",
      backgroundColor: "#F8FAFC",
      textColor: "#1E293B",
      backgroundImageId: null
    }
  },
  {
    key: "green",
    labelKey: "admin.qaTheme.presetGreen",
    theme: {
      primaryColor: "#047857",
      accentColor: "#2563EB",
      backgroundColor: "#F0FDF4",
      textColor: "#064E3B",
      backgroundImageId: null
    }
  }
];

export function QaThemeSettingsForm({ theme }: { theme: QaTheme }) {
  const router = useRouter();
  const { t } = useLanguage();
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<QaTheme>(theme);
  const [draftText, setDraftText] = useState<Record<QaThemeKey, string>>(getColorDraft(theme));
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

    const response = await fetch("/api/admin/qa/theme", {
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

  function setColor(name: QaThemeKey, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setDraftText((current) => ({ ...current, [name]: value }));
    setState("idle");
    setMessage("");
  }

  function setTextColor(name: QaThemeKey, value: string) {
    setDraftText((current) => ({ ...current, [name]: value }));
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setValues((current) => ({ ...current, [name]: value }));
      setState("idle");
      setMessage("");
    }
  }

  function applyPreset(nextTheme: QaTheme) {
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
    <form className="admin-panel career-admin-theme qa-admin-theme" encType="multipart/form-data" onSubmit={submit}>
      <div className="career-admin-theme__header">
        <div>
          <p className="article-kicker">{t("admin.qaTheme.themeKicker")}</p>
          <h2>{t("admin.qaTheme.themeTitle")}</h2>
          <p className="message">{t("admin.qaTheme.themeDescription")}</p>
        </div>
        <div className="career-admin-theme__actions">
          <button className="button secondary" type="button" onClick={() => applyPreset(defaultQaTheme)}>
            <RotateCcw size={18} />
            {t("admin.qaTheme.resetTheme")}
          </button>
          <button className="button" type="submit" disabled={state === "saving"}>
            <Save size={18} />
            {state === "saving" ? t("admin.common.saving") : t("admin.qaTheme.saveTheme")}
          </button>
        </div>
      </div>

      <div className="career-admin-theme__layout">
        <section className="career-admin-theme__controls" aria-label={t("admin.qaTheme.themeControls")}>
          <div className="career-admin-theme__presets" aria-label={t("admin.qaTheme.presets")}>
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
                <label htmlFor={`qa-${field.key}`}>{t(`admin.qaTheme.${field.key}`)}</label>
                <div className="career-admin-theme__color-row">
                  <input
                    id={`qa-${field.key}`}
                    aria-label={t(`admin.qaTheme.${field.key}`)}
                    type="color"
                    value={values[field.key]}
                    onChange={(event) => setColor(field.key, event.target.value)}
                  />
                  <input
                    aria-label={`${t(`admin.qaTheme.${field.key}`)} hex`}
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
              <label htmlFor="qa-background-image">{t("admin.qaTheme.backgroundImage")}</label>
              <p>{t("admin.qaTheme.backgroundImageHelp")}</p>
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
                id="qa-background-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onBackgroundChange}
              />
              {backgroundPreviewUrl ? (
                <button className="button danger" type="button" disabled={state === "saving"} onClick={clearBackgroundImage}>
                  {t("admin.qaTheme.removeBackgroundImage")}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="career-admin-theme__preview" style={previewStyle} aria-label={t("admin.qaTheme.preview")}>
          <div className="career-admin-theme__preview-hero">
            <span>{t("admin.qaTheme.previewKicker")}</span>
            <strong>{t("formsFeature.qa.publicTitle")}</strong>
            <p>{t("formsFeature.qa.publicIntro")}</p>
            <button type="button">{t("formsFeature.qa.askQuestion")}</button>
          </div>
          <div className="career-admin-theme__preview-card">
            <span>{t("admin.qaTheme.previewQuestion")}</span>
            <strong>{t("formsFeature.qa.answer")}</strong>
            <p>{t("admin.qaTheme.previewAnswer")}</p>
            <div>
              <small>{t("formsFeature.qa.recentlyAnswered")}</small>
              <small>{t("formsFeature.common.category")}</small>
            </div>
          </div>
        </aside>
      </div>

      {message ? <p className={`message ${state === "error" ? "error" : ""}`}>{message}</p> : null}
    </form>
  );
}

function getColorDraft(theme: QaTheme): Record<QaThemeKey, string> {
  return {
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor
  };
}
