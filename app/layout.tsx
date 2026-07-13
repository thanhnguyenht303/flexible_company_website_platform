import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { getThemeStyle, getPublicSiteContext } from "@/lib/public-data";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getPublicSiteContext();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: site.siteName,
      template: `%s | ${site.siteName}`
    },
    description: site.description ?? site.tagline ?? "Flexible company website platform",
    openGraph: {
      title: site.siteName,
      description: site.description ?? site.tagline ?? undefined,
      url: process.env.NEXT_PUBLIC_SITE_URL,
      images: ["/placeholder-og.svg"]
    }
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getPublicSiteContext();

  return {
    colorScheme: "only light",
    themeColor: theme.backgroundColor
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [themeStyle, language] = await Promise.all([getThemeStyle(), getCurrentLanguage()]);

  return (
    <html lang={language} style={themeStyle}>
      <body style={themeStyle}>{children}</body>
    </html>
  );
}
