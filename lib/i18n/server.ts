import "server-only";

import { cookies } from "next/headers";
import {
  languageCookieName,
  normalizeLanguage,
  translate,
  type Language,
  type TranslationValues
} from "@/lib/i18n/translations";

export async function getCurrentLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  return normalizeLanguage(cookieStore.get(languageCookieName)?.value);
}

export async function getServerTranslations() {
  const language = await getCurrentLanguage();
  return {
    language,
    t: (key: string, values?: TranslationValues) => translate(language, key, values)
  };
}
