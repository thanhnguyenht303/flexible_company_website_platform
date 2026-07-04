import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { LanguageProvider } from "@/components/public/LanguageProvider";
import { getAdminUser } from "@/lib/auth";
import { getVisibleFooterPartners } from "@/lib/footer-partners";
import { getCurrentLanguage } from "@/lib/i18n/server";
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

  return (
    <LanguageProvider initialLanguage={language}>
      <div className="public-shell">
        <PublicHeader siteName={site.siteName} logoId={logoId} navItems={navItems} />
        {pageSlug && hasPermission(adminUser, "site.settings.update") ? (
          <a className="admin-edit-shortcut" href={`/admin/page-builder/${pageSlug}`}>
            {translate(language, "shell.editPage")}
          </a>
        ) : null}
        <main className="public-main">{children}</main>
        <PublicFooter site={site} showPrivacy={showPrivacy} partners={partners} />
      </div>
    </LanguageProvider>
  );
}
