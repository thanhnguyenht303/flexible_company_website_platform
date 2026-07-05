import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { QaItemForm } from "@/components/admin/QaItemForm";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NewQaPage() {
  const { t } = await getServerTranslations();
  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("formsFeature.qa.newQa")}</h1>
        <Link className="button secondary" href="/admin/qa">{t("formsFeature.common.back")}</Link>
      </div>
      <QaItemForm />
    </AdminShell>
  );
}
