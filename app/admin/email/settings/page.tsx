import { AdminShell } from "@/components/admin/AdminShell";
import { EmailCenterNav } from "@/components/admin/email/EmailCenterNav";
import { EmailSettingsForm } from "@/components/admin/email/EmailSettingsForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { publicEmailSettings } from "@/modules/email/email.admin";

export default async function EmailSettingsPage() {
  const [{ t }, settings] = await Promise.all([getServerTranslations(), prisma.emailSettings.findUnique({ where: { id: "default" } })]);
  return <AdminShell requiredAuthority="email.manage"><div className="admin-page-header"><div><h1>{t("admin.email.settings")}</h1><p className="message">Secrets are encrypted at rest and never returned to the browser.</p></div></div><EmailCenterNav /><EmailSettingsForm initial={publicEmailSettings(settings)} /></AdminShell>;
}
