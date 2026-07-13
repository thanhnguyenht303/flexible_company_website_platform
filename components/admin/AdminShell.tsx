import Image from "next/image";
import Link from "next/link";
import { requireAdminAuthority, requireAdminUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { LanguageProvider } from "@/components/public/LanguageProvider";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { RouteFocusManager } from "@/components/shared/RouteFocusManager";
import { SkipLink } from "@/components/shared/SkipLink";
import { getServerTranslations } from "@/lib/i18n/server";
import type { AuthorityKey } from "@/config/admin-authorities";
import { getGrantedAuthorityKeys } from "@/lib/permissions";

export async function AdminShell({ children, requiredAuthority }: { children: React.ReactNode; requiredAuthority?: AuthorityKey }) {
  const [user, { language, t }] = await Promise.all([
    requiredAuthority ? requireAdminAuthority(requiredAuthority) : requireAdminUser(),
    getServerTranslations()
  ]);
  const displayName = user.displayName ?? user.username;

  return (
    <LanguageProvider initialLanguage={language}>
      <div className="admin-shell">
        <SkipLink>{t("shell.skipToMain")}</SkipLink>
        <RouteFocusManager targetId="main-content" />
        <aside className="admin-sidebar">
          <Link href="/admin/dashboard" className="brand">
            <Image src="/placeholder-logo.svg" alt="" width={34} height={34} />
            <span>{t("admin.brand")}</span>
          </Link>
          <div className="admin-language">
            <LanguageSwitcher />
          </div>
          <AdminNav authorityKeys={getGrantedAuthorityKeys(user)} />
          <p className="message">{t("admin.signedInAs", { name: displayName })}</p>
        </aside>
        <main className="admin-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}
