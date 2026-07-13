import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { LeadEditForm } from "@/components/admin/LeadEditForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { badgeTone, firstStringValue, formatDateTime, priorityLabel, statusLabel, valueEntries } from "@/modules/forms/forms.labels";
import { EmailComposeForm } from "@/components/admin/email/EmailComposeForm";
import { getAdminUser } from "@/lib/auth";
import { hasAuthority } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ language, t }, lead, user] = await Promise.all([getServerTranslations(), prisma.lead.findUnique({ where: { id } }), getAdminUser()]);
  if (!lead) notFound();

  const [submission, form, qaItem] = await Promise.all([
    lead.submissionId ? prisma.formSubmission.findUnique({ where: { id: lead.submissionId } }) : null,
    lead.sourceFormId ? prisma.form.findUnique({ where: { id: lead.sourceFormId }, select: { id: true, name: true, slug: true } }) : null,
    prisma.qaItem.findFirst({ where: { leadId: lead.id } })
  ]);
  const canEmail = hasAuthority(user, "email.manage");
  const templates = canEmail ? await prisma.emailTemplate.findMany({ where: { isActive: true, category: { in: ["lead", "form", "general"] } }, orderBy: { name: "asc" }, select: { id: true, name: true, key: true, subject: true, body: true, category: true, customVariables: true } }) : [];

  return (
    <AdminShell requiredAuthority="leads.manage">
      <div className="admin-page-header">
        <div>
          <h1>{lead.name || lead.email || "Lead"}</h1>
          <p className="message">
            <span className={`badge badge--${badgeTone(lead.status)}`}>{statusLabel(language, lead.status)}</span>{" "}
            <span className={`badge badge--${badgeTone(lead.priority)}`}>{priorityLabel(language, lead.priority)}</span>{" "}
            {formatDateTime(lead.createdAt, language)}
          </p>
        </div>
        <Link className="button secondary" href="/admin/leads">
          {t("formsFeature.common.back")}
        </Link>
      </div>
      <div className="lead-detail-grid">
        <section className="admin-panel">
          <h2>{t("formsFeature.leads.contact")}</h2>
          <dl className="detail-list">
            <dt>{t("common.name")}</dt>
            <dd>{lead.name || t("formsFeature.common.unknown")}</dd>
            <dt>{t("formsFeature.leads.email")}</dt>
            <dd>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : t("formsFeature.common.none")}</dd>
            <dt>{t("formsFeature.leads.phone")}</dt>
            <dd>{lead.phone || t("formsFeature.common.none")}</dd>
            <dt>{t("formsFeature.leads.company")}</dt>
            <dd>{lead.companyName || t("formsFeature.common.none")}</dd>
            <dt>{t("formsFeature.leads.sourceForm")}</dt>
            <dd>{form ? <Link href={`/admin/forms/${form.id}/submissions`}>{form.name}</Link> : t("formsFeature.common.none")}</dd>
            <dt>{t("formsFeature.qa.title")}</dt>
            <dd>{qaItem ? <Link href={`/admin/qa/${qaItem.id}`}>{qaItem.title}</Link> : t("formsFeature.common.none")}</dd>
          </dl>
        </section>
        <LeadEditForm
          lead={{
            id: lead.id,
            status: lead.status,
            priority: lead.priority,
            internalNote: lead.internalNote,
            followUpAt: lead.followUpAt
          }}
        />
      </div>
      {submission ? (
        <section className="admin-panel">
          <h2>{t("formsFeature.submissions.values")}</h2>
          <p className="message">{firstStringValue(submission.values, ["questionTitle", "subject", "message"])}</p>
          <dl className="value-list">
            {valueEntries(submission.values).map((entry) => (
              <div key={entry.key}>
                <dt>{entry.label}</dt>
                <dd>{entry.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {canEmail && lead.email ? <section><h2>{t("admin.email.compose")}</h2><EmailComposeForm initialTo={lead.email} templates={templates} relatedType="lead" relatedId={lead.id} variables={{ leadName: lead.name || "", leadEmail: lead.email, leadPhone: lead.phone || "", companyName: lead.companyName || "", sourceForm: form?.name || lead.sourceType }} /></section> : null}
    </AdminShell>
  );
}
