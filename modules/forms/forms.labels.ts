import { translate, type Language } from "@/lib/i18n/translations";
import type { FormFieldType } from "@/modules/forms/forms.types";

export function statusLabel(language: Language, status: string) {
  return translate(language, `formsFeature.status.${status}`, undefined);
}

export function priorityLabel(language: Language, priority: string) {
  return translate(language, `formsFeature.priority.${priority}`, undefined);
}

export function fieldTypeLabel(language: Language, type: string) {
  return translate(language, `formsFeature.fieldTypes.${type as FormFieldType}`, undefined);
}

export function badgeTone(value: string) {
  if (["PUBLISHED", "WON", "QUALIFIED", "ANSWERED", "RESOLVED"].includes(value)) return "success";
  if (["SPAM", "LOST", "URGENT"].includes(value)) return "danger";
  if (["ARCHIVED"].includes(value)) return "muted";
  if (["HIGH", "PROPOSAL_SENT", "REVIEWING"].includes(value)) return "warning";
  return "neutral";
}

export function formatDateTime(value: Date, language: Language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

export function formatDate(value: Date | null, language: Language) {
  if (!value) return translate(language, "formsFeature.common.none");
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(value);
}

export function valueEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([key, entry]) => ({
    key,
    label: humanizeKey(key),
    value: formatValue(entry)
  }));
}

export function firstStringValue(value: unknown, keys: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const entry = record[key];
    if (typeof entry === "string" && entry.trim()) return entry.trim();
  }
  return "";
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
