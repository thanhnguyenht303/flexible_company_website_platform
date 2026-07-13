import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { FormBuilderForm } from "@/components/admin/FormBuilderForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ t }, form] = await Promise.all([getServerTranslations(), prisma.form.findUnique({
    where: { id },
    include: { fields: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } }
  })]);
  if (!form) notFound();

  return (
    <AdminShell requiredAuthority="forms.manage">
      <div className="admin-page-header">
        <h1>{t("formsFeature.forms.editForm")}</h1>
        <Link className="button secondary" href="/admin/forms">
          {t("formsFeature.common.back")}
        </Link>
      </div>
      <FormBuilderForm
        form={{
          id: form.id,
          name: form.name,
          slug: form.slug,
          description: form.description,
          status: form.status,
          successMessage: form.successMessage,
          redirectUrl: form.redirectUrl,
          notificationEmails: form.notificationEmails,
          sourceType: form.sourceType,
          linkedEntityType: form.linkedEntityType,
          linkedEntityId: form.linkedEntityId,
          fields: form.fields.map((field) => ({
            id: field.id,
            type: field.type,
            label: field.label,
            key: field.key,
            helpText: field.helpText,
            placeholder: field.placeholder,
            required: field.required,
            options: field.options,
            defaultValue: field.defaultValue,
            sortOrder: field.sortOrder
          }))
        }}
      />
    </AdminShell>
  );
}
