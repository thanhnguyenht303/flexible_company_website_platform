import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { QaItemForm } from "@/components/admin/QaItemForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { badgeTone, formatDateTime, statusLabel } from "@/modules/forms/forms.labels";

export const dynamic = "force-dynamic";

export default async function EditQaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ language, t }, item] = await Promise.all([getServerTranslations(), prisma.qaItem.findUnique({ where: { id } })]);
  if (!item) notFound();

  return (
    <AdminShell requiredAuthority="qa.manage">
      <div className="admin-page-header">
        <div>
          <h1>{t("formsFeature.qa.editQa")}</h1>
          <p className="message">
            <span className={`badge badge--${badgeTone(item.status)}`}>{statusLabel(language, item.status)}</span>{" "}
            {formatDateTime(item.createdAt, language)}
          </p>
          {item.status === "PUBLISHED" ? <p className="message"><Link href={`/qa/${item.slug}`}>{t("formsFeature.qa.viewPublicPage")}</Link></p> : null}
        </div>
        <Link className="button secondary" href="/admin/qa">{t("formsFeature.common.back")}</Link>
      </div>
      <QaItemForm
        item={{
          id: item.id,
          title: item.title,
          slug: item.slug,
          question: item.question,
          answer: item.answer,
          submitterName: item.submitterName,
          submitterEmail: item.submitterEmail,
          category: item.category,
          status: item.status,
          relatedType: item.relatedType,
          relatedId: item.relatedId
        }}
      />
    </AdminShell>
  );
}
