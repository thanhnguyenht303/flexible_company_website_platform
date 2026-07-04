import Image from "next/image";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { LanguageProvider } from "@/components/public/LanguageProvider";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { getServerTranslations } from "@/lib/i18n/server";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const [user, { language, t }] = await Promise.all([requireAdminUser(), getServerTranslations()]);
  const displayName = user.displayName ?? user.username;

  return (
    <LanguageProvider initialLanguage={language}>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Link href="/admin/dashboard" className="brand">
            <Image src="/placeholder-logo.svg" alt="" width={34} height={34} />
            <span>{t("admin.brand")}</span>
          </Link>
          <div className="admin-language">
            <LanguageSwitcher />
          </div>
          <AdminNav />
          <p className="message">{t("admin.signedInAs", { name: displayName })}</p>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </LanguageProvider>
  );
}
