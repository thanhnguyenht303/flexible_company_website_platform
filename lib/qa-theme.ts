import type { CSSProperties } from "react";

export type QaTheme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  backgroundImageId: string | null;
};

export const defaultQaTheme: QaTheme = {
  primaryColor: "#2563EB",
  accentColor: "#64748B",
  backgroundColor: "#F8FAFC",
  textColor: "#1E293B",
  backgroundImageId: null
};

export function getQaThemeFromSite(site: { defaultSeo?: unknown }) {
  const settings = getObject(getObject(site.defaultSeo).qaTheme);

  return {
    primaryColor: colorValue(settings.primaryColor, defaultQaTheme.primaryColor),
    accentColor: colorValue(settings.accentColor, defaultQaTheme.accentColor),
    backgroundColor: colorValue(settings.backgroundColor, defaultQaTheme.backgroundColor),
    textColor: colorValue(settings.textColor, defaultQaTheme.textColor),
    backgroundImageId: idValue(settings.backgroundImageId)
  };
}

export function getQaThemeStyle(theme: QaTheme): CSSProperties {
  return {
    "--qa-primary": theme.primaryColor,
    "--qa-primary-strong": mixHex(theme.primaryColor, "#000000", 0.18),
    "--qa-accent": theme.accentColor,
    "--qa-background": theme.backgroundColor,
    "--qa-background-image": theme.backgroundImageId ? `url("/api/media/${theme.backgroundImageId}")` : "none",
    "--qa-background-overlay": theme.backgroundImageId ? "rgb(255 255 255 / 0.24)" : "transparent",
    "--qa-text": theme.textColor,
    "--qa-border": mixHex(theme.primaryColor, "#ffffff", 0.72),
    "--qa-surface": "#FFFFFF"
  } as CSSProperties;
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function colorValue(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

function idValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function mixHex(base: string, target: string, amount: number) {
  const from = hexToRgb(base);
  const to = hexToRgb(target);
  if (!from || !to) return base;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * amount);
  return `#${toHex(mix(from.r, to.r))}${toHex(mix(from.g, to.g))}${toHex(mix(from.b, to.b))}`;
}

function hexToRgb(value: string) {
  const match = value.match(/^#([0-9A-Fa-f]{6})$/);
  if (!match) return null;
  const int = Number.parseInt(match[1], 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}
