import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmailCenterNav } from "@/components/admin/email/EmailCenterNav";
import { EmailComposeForm } from "@/components/admin/email/EmailComposeForm";
import { EmailMessageTable } from "@/components/admin/email/EmailMessageTable";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function EmailCenterPage() {
  const [{ t }, settings, sent, failed, unread, recent, templates] = await Promise.all([
    getServerTranslations(),
    prisma.emailSettings.findUnique({ where: { id: "default" } }),
    prisma.emailMessage.count({ where: { status: "SENT" } }),
    prisma.emailMessage.count({ where: { status: "FAILED" } }),
    prisma.emailMessage.count({ where: { direction: "INBOUND", status: "RECEIVED", readAt: null } }),
    prisma.emailMessage.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.emailTemplate.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, key: true, subject: true, body: true, category: true, customVariables: true } })
  ]);
  return <AdminShell requiredAuthority="email.manage">
    <div className="admin-page-header"><div><h1>{t("admin.email.title")}</h1><p className="message">{t("admin.email.description")}</p></div><Link className="button secondary" href="/admin/email/settings">{t("admin.email.settings")}</Link></div>
    <EmailCenterNav />
    <div className="admin-grid email-stats">
      <div className="admin-panel"><span className="message">{t("admin.email.defaultReceivingEmail")}</span><strong className="stat">{settings?.defaultReceivingEmail || "Not configured"}</strong></div>
      <div className="admin-panel"><span className="message">{t("admin.email.sent")}</span><strong className="stat">{sent}</strong></div>
      <div className="admin-panel"><span className="message">Failed</span><strong className="stat">{failed}</strong></div>
      <div className="admin-panel"><span className="message">Unread</span><strong className="stat">{unread}</strong></div>
    </div>
    <details className="admin-panel email-compose-details"><summary className="button">{t("admin.email.compose")}</summary><EmailComposeForm templates={templates} /></details>
    <h2>Recent email</h2><EmailMessageTable messages={recent} emptyLabel={t("admin.email.noMessages")} />
  </AdminShell>;
}
