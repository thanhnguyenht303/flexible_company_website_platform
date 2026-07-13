import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { LanguageProvider } from "@/components/public/LanguageProvider";
import { RouteFocusManager } from "@/components/shared/RouteFocusManager";
import { SkipLink } from "@/components/shared/SkipLink";
import { getAdminUser } from "@/lib/auth";
import { getFooterThemeFromSite, getFooterThemeStyle } from "@/lib/footer-theme";
import { getVisibleFooterPartners } from "@/lib/footer-partners";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { getNavbarThemeFromSite, getNavbarThemeStyle } from "@/lib/navbar-theme";
import { translate } from "@/lib/i18n/translations";
import { getPublicPageVisibility } from "@/lib/page-visibility";
import { hasPermission } from "@/lib/permissions";
import { getPublicSiteContext } from "@/lib/public-data";

export async function PublicShell({ children, pageSlug }: { children: React.ReactNode; pageSlug?: string }) {
  const [{ site }, pageVisibility, partners, adminUser, language] = await Promise.all([
    getPublicSiteContext(),
    getPublicPageVisibility(),
    getVisibleFooterPartners(),
    getAdminUser(),
    getCurrentLanguage()
  ]);
  const navItems = pageVisibility
    .filter((page) => page.visible && page.showInHeader)
    .map(({ slug, title, href }) => ({ slug, title, href }));
  const showPrivacy = pageVisibility.some((page) => page.slug === "privacy" && page.visible);
  const logoId = typeof (site as { logoId?: unknown }).logoId === "string" ? (site as { logoId: string }).logoId : null;
  const footerTheme = getFooterThemeFromSite(site);
  const navbarTheme = getNavbarThemeFromSite(site);

  return (
    <LanguageProvider initialLanguage={language}>
      <div className="public-shell">
        <SkipLink>{translate(language, "shell.skipToMain")}</SkipLink>
        <RouteFocusManager targetId="main-content" />
        <PublicHeader siteName={site.siteName} logoId={logoId} navItems={navItems} style={getNavbarThemeStyle(navbarTheme)} />
        {pageSlug && hasPermission(adminUser, "pages.manage") ? (
          <a className="admin-edit-shortcut" href={`/admin/page-builder/${pageSlug}`}>
            {translate(language, "shell.editPage")}
          </a>
        ) : null}
        <main className="public-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
        <PublicFooter site={site} showPrivacy={showPrivacy} partners={partners} style={getFooterThemeStyle(footerTheme)} />
      </div>
    </LanguageProvider>
  );
}
