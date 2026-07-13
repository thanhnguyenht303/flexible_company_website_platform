import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { FooterPartnerForm } from "@/components/admin/FooterPartnerForm";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NewFooterPartnerPage() {
  const { t } = await getServerTranslations();

  return (
    <AdminShell requiredAuthority="footer.manage">
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.newFooterCollaborator")}</h1>
        <Link className="button secondary" href="/admin/footer">
          {t("admin.common.back")}
        </Link>
      </div>
      <FooterPartnerForm />
    </AdminShell>
  );
}
