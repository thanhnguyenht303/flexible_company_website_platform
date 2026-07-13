import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { FooterThemeSettingsForm } from "@/components/admin/FooterThemeSettingsForm";
import { FooterPartnerTableActions } from "@/components/admin/FooterPartnerTableActions";
import { prisma } from "@/lib/db";
import { getFooterThemeFromSite } from "@/lib/footer-theme";
import { getServerTranslations } from "@/lib/i18n/server";

async function getFooterPartners() {
  try {
    return await prisma.footerPartner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });
  } catch {
    return [];
  }
}

export default async function AdminFooterPage() {
  const [partners, site, { t }] = await Promise.all([
    getFooterPartners(),
    prisma.siteSetting.findFirst({ select: { defaultSeo: true } }),
    getServerTranslations()
  ]);
  const footerTheme = getFooterThemeFromSite(site ?? {});

  return (
    <AdminShell requiredAuthority="footer.manage">
      <div className="admin-page-header">
        <h1>{t("admin.common.footer")}</h1>
        <Link className="button" href="/admin/footer/new">
          {t("admin.common.new")}
        </Link>
      </div>
      <FooterThemeSettingsForm theme={footerTheme} />
      <div className="admin-panel">
        <h2>{t("admin.common.collaboratingCompanies")}</h2>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("admin.common.logo")}</th>
              <th scope="col">{t("admin.common.company")}</th>
              <th scope="col">{t("admin.common.website")}</th>
              <th scope="col">{t("admin.common.sort")}</th>
              <th scope="col">{t("admin.common.visible")}</th>
              <th scope="col">{t("admin.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id}>
                <td>
                  <div className="footer-table-logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/${partner.logoId}`} alt="" />
                  </div>
                </td>
                <td>{partner.name}</td>
                <td>{partner.websiteUrl ? <a href={partner.websiteUrl}>{partner.websiteUrl}</a> : ""}</td>
                <td>{partner.sortOrder}</td>
                <td>
                  <span className="badge">{partner.isVisible ? t("admin.common.yes") : t("admin.common.no")}</span>
                </td>
                <td>
                  <FooterPartnerTableActions
                    id={partner.id}
                    title={partner.name}
                    isVisible={partner.isVisible}
                  />
                </td>
              </tr>
            ))}
            {partners.length === 0 ? (
              <tr>
                <td colSpan={6}>{t("admin.empty.footer")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
