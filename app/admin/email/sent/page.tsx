import { AdminShell } from "@/components/admin/AdminShell";
import { EmailCenterNav } from "@/components/admin/email/EmailCenterNav";
import { EmailMessageTable } from "@/components/admin/email/EmailMessageTable";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function SentPage() { const [{ t }, messages] = await Promise.all([getServerTranslations(), prisma.emailMessage.findMany({ where: { direction: "OUTBOUND" }, orderBy: { createdAt: "desc" }, take: 100 })]); return <AdminShell requiredAuthority="email.manage"><div className="admin-page-header"><h1>{t("admin.email.sent")}</h1></div><EmailCenterNav /><EmailMessageTable messages={messages} emptyLabel={t("admin.email.noMessages")} /></AdminShell>; }
