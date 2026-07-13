import type { CSSProperties } from "react";

export type CareerTheme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  backgroundImageId: string | null;
};

export const defaultCareerTheme: CareerTheme = {
  primaryColor: "#0369A1",
  accentColor: "#16A34A",
  backgroundColor: "#F0F9FF",
  textColor: "#0C4A6E",
  backgroundImageId: null
};

export function getCareerThemeFromSite(site: { defaultSeo?: unknown }) {
  const settings = getObject(getObject(site.defaultSeo).careerTheme);

  return {
    primaryColor: colorValue(settings.primaryColor, defaultCareerTheme.primaryColor),
    accentColor: colorValue(settings.accentColor, defaultCareerTheme.accentColor),
    backgroundColor: colorValue(settings.backgroundColor, defaultCareerTheme.backgroundColor),
    textColor: colorValue(settings.textColor, defaultCareerTheme.textColor),
    backgroundImageId: idValue(settings.backgroundImageId)
  };
}

export function getCareerThemeStyle(theme: CareerTheme): CSSProperties {
  return {
    "--career-primary": theme.primaryColor,
    "--career-primary-strong": mixHex(theme.primaryColor, "#000000", 0.18),
    "--career-accent": theme.accentColor,
    "--career-background": theme.backgroundColor,
    "--career-background-image": theme.backgroundImageId ? `url("/api/media/${theme.backgroundImageId}")` : "none",
    "--career-background-overlay": theme.backgroundImageId ? "rgb(255 255 255 / 0.24)" : "transparent",
    "--career-text": theme.textColor,
    "--career-border": mixHex(theme.primaryColor, "#ffffff", 0.72),
    "--career-surface": "#FFFFFF"
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
