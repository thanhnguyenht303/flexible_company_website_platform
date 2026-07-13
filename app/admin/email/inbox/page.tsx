import { AdminShell } from "@/components/admin/AdminShell";
import { EmailCenterNav } from "@/components/admin/email/EmailCenterNav";
import { EmailMessageTable } from "@/components/admin/email/EmailMessageTable";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { InboxSyncButton } from "@/components/admin/email/InboxSyncButton";

export default async function InboxPage() { const [{ t }, messages, settings] = await Promise.all([getServerTranslations(), prisma.emailMessage.findMany({ where: { direction: "INBOUND" }, orderBy: { createdAt: "desc" }, take: 100 }), prisma.emailSettings.findUnique({ where: { id: "default" }, select: { imapLastSyncAt: true } })]); return <AdminShell requiredAuthority="email.manage"><div className="admin-page-header"><div><h1>{t("admin.email.inbox")}</h1><p className="message">Last synchronized: {settings?.imapLastSyncAt?.toLocaleString() || "Never"}</p></div><InboxSyncButton /></div><EmailCenterNav /><EmailMessageTable messages={messages} emptyLabel={t("admin.email.noMessages")} /></AdminShell>; }
