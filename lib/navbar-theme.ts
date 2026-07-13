import type { CSSProperties } from "react";
import { ensureReadableHexColor } from "@/lib/css-color";

export type NavbarTheme = {
  backgroundColor: string;
  textColor: string;
};

export const defaultNavbarTheme: NavbarTheme = {
  backgroundColor: "#FFFFFF",
  textColor: "#0F172A"
};

export function getNavbarThemeFromSite(site: { defaultSeo?: unknown }) {
  const settings = getObject(getObject(site.defaultSeo).navbarTheme);
  const backgroundColor = colorValue(settings.backgroundColor, defaultNavbarTheme.backgroundColor);
  const configuredTextColor = colorValue(settings.textColor, defaultNavbarTheme.textColor);

  return {
    backgroundColor,
    textColor: ensureReadableHexColor(configuredTextColor, backgroundColor)
  };
}

export function getNavbarThemeStyle(theme: NavbarTheme): CSSProperties {
  return {
    "--navbar-background": theme.backgroundColor,
    "--navbar-text": theme.textColor
  } as CSSProperties;
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function colorValue(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}
