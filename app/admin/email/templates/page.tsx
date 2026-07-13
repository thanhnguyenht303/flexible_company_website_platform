import { AdminShell } from "@/components/admin/AdminShell";
import { EmailCenterNav } from "@/components/admin/email/EmailCenterNav";
import { EmailTemplateManager } from "@/components/admin/email/EmailTemplateManager";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function EmailTemplatesPage() {
  const [{ t }, templates] = await Promise.all([getServerTranslations(), prisma.emailTemplate.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] })]);
  return <AdminShell requiredAuthority="email.manage"><div className="admin-page-header"><div><h1>{t("admin.email.templates")}</h1><p className="message">Reusable, editable templates for careers, forms, leads, inquiries, and Q&amp;A.</p></div></div><EmailCenterNav /><EmailTemplateManager initialTemplates={templates} /></AdminShell>;
}
