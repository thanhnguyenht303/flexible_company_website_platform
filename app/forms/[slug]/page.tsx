import { notFound } from "next/navigation";
import { DynamicForm } from "@/components/public/DynamicForm";
import { PublicShell } from "@/components/public/PublicShell";
import { getServerTranslations } from "@/lib/i18n/server";
import { getPublicFormBySlug } from "@/modules/forms/forms.service";

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ t }, form] = await Promise.all([getServerTranslations(), getPublicFormBySlug(slug)]);
  if (!form) notFound();

  return (
    <PublicShell pageSlug="forms">
      <section className="section public-form-page">
        <div className="container narrow">
          <DynamicForm form={form} submitLabel={t("formsFeature.publicForm.submit")} />
        </div>
      </section>
    </PublicShell>
  );
}
