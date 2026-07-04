"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { languageCookieName, languageStorageKey, languages, type Language } from "@/lib/i18n/translations";

export function LanguageSwitcher() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLanguage = event.target.value as Language;
    window.localStorage.setItem(languageStorageKey, nextLanguage);
    document.cookie = `${languageCookieName}=${nextLanguage}; path=/; max-age=31536000; SameSite=Lax`;
    setLanguage(nextLanguage);
    router.refresh();
  }

  return (
    <label className="language-switcher">
      <span className="visually-hidden">{t("language.label")}</span>
      <Languages size={16} aria-hidden="true" />
      <select value={language} aria-label={t("language.label")} onChange={onChange}>
        {languages.map((item) => (
          <option value={item} key={item}>
            {item === "en" ? t("language.english") : t("language.vietnamese")}
          </option>
        ))}
      </select>
    </label>
  );
}
