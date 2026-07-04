"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  defaultLanguage,
  languageCookieName,
  languageStorageKey,
  normalizeLanguage,
  translate,
  type Language,
  type TranslationValues
} from "@/lib/i18n/translations";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage = defaultLanguage
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const router = useRouter();
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(languageStorageKey);
    if (!storedValue) {
      window.localStorage.setItem(languageStorageKey, language);
      return;
    }

    const storedLanguage = normalizeLanguage(storedValue);
    if (storedLanguage !== language) {
      window.localStorage.setItem(languageStorageKey, storedLanguage);
      document.cookie = `${languageCookieName}=${storedLanguage}; path=/; max-age=31536000; SameSite=Lax`;
      setLanguageState(storedLanguage);
      router.refresh();
    }
  }, [language, router]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(languageStorageKey, language);
    document.cookie = `${languageCookieName}=${language}; path=/; max-age=31536000; SameSite=Lax`;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key, values) => translate(language, key, values)
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: defaultLanguage,
      setLanguage: () => undefined,
      t: (key: string, values?: TranslationValues) => translate(defaultLanguage, key, values)
    };
  }

  return context;
}
