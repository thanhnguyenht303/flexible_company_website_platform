"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/public/LanguageProvider";

const items = [
  ["/admin/email", "admin.email.title"],
  ["/admin/email/inbox", "admin.email.inbox"],
  ["/admin/email/sent", "admin.email.sent"],
  ["/admin/email/templates", "admin.email.templates"],
  ["/admin/email/settings", "admin.email.settings"],
  ["/admin/email/logs", "admin.email.logs"]
] as const;

export function EmailCenterNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  return (
    <nav className="email-center-nav" aria-label={t("admin.email.title")}>
      {items.map(([href, label]) => {
        const active = href === "/admin/email" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} className={`button secondary${active ? " active" : ""}`} href={href}>{t(label)}</Link>;
      })}
    </nav>
  );
}
