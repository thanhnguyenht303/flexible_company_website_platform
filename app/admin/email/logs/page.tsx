import { AdminShell } from "@/components/admin/AdminShell";
import { EmailCenterNav } from "@/components/admin/email/EmailCenterNav";
import { EmailMessageTable } from "@/components/admin/email/EmailMessageTable";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function LogsPage() { const [{ t }, messages] = await Promise.all([getServerTranslations(), prisma.emailMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 })]); return <AdminShell requiredAuthority="email.manage"><div className="admin-page-header"><h1>{t("admin.email.logs")}</h1></div><EmailCenterNav /><EmailMessageTable messages={messages} emptyLabel={t("admin.email.noMessages")} /></AdminShell>; }
