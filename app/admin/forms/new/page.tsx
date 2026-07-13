import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { FormBuilderForm } from "@/components/admin/FormBuilderForm";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NewFormPage() {
  const { t } = await getServerTranslations();
  return (
    <AdminShell requiredAuthority="forms.manage">
      <div className="admin-page-header">
        <h1>{t("formsFeature.forms.newForm")}</h1>
        <Link className="button secondary" href="/admin/forms">
          {t("formsFeature.common.back")}
        </Link>
      </div>
      <FormBuilderForm />
    </AdminShell>
  );
}
