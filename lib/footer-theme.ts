import type { CSSProperties } from "react";
import { ensureReadableHexColor } from "@/lib/css-color";

export type FooterTheme = {
  backgroundColor: string;
  textColor: string;
};

export const defaultFooterTheme: FooterTheme = {
  backgroundColor: "#101828",
  textColor: "#FFFFFF"
};

export function getFooterThemeFromSite(site: { defaultSeo?: unknown }) {
  const settings = getObject(getObject(site.defaultSeo).footerTheme);
  const backgroundColor = colorValue(settings.backgroundColor, defaultFooterTheme.backgroundColor);
  const configuredTextColor = colorValue(settings.textColor, defaultFooterTheme.textColor);

  return {
    backgroundColor,
    textColor: ensureReadableHexColor(configuredTextColor, backgroundColor)
  };
}

export function getFooterThemeStyle(theme: FooterTheme): CSSProperties {
  return {
    "--footer-background": theme.backgroundColor,
    "--footer-text": theme.textColor
  } as CSSProperties;
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function colorValue(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}
