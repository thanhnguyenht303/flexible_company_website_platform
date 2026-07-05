"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { useLanguage } from "@/components/public/LanguageProvider";
import {
  BarChart3,
  Briefcase,
  CircleHelp,
  ClipboardList,
  FileText,
  Handshake,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Palette,
  Settings,
  Shield,
  Users,
  UserRoundCheck,
  Wrench
} from "lucide-react";

type AdminNavLink = {
  href: string;
  labelKey: string;
  icon: ComponentType<LucideProps>;
};

const links: AdminNavLink[] = [
  { href: "/admin/dashboard", labelKey: "admin.nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/settings/site", labelKey: "admin.nav.siteSettings", icon: Settings },
  { href: "/admin/settings/theme", labelKey: "admin.nav.theme", icon: Palette },
  { href: "/admin/pages", labelKey: "admin.nav.pages", icon: FileText },
  { href: "/admin/services", labelKey: "admin.nav.services", icon: Wrench },
  { href: "/admin/products", labelKey: "admin.nav.products", icon: Package },
  { href: "/admin/posts", labelKey: "admin.nav.posts", icon: BarChart3 },
  { href: "/admin/careers", labelKey: "admin.nav.careers", icon: Briefcase },
  { href: "/admin/forms", labelKey: "admin.nav.forms", icon: ClipboardList },
  { href: "/admin/leads", labelKey: "admin.nav.leads", icon: UserRoundCheck },
  { href: "/admin/qa", labelKey: "admin.nav.qa", icon: CircleHelp },
  { href: "/admin/team", labelKey: "admin.nav.team", icon: Users },
  { href: "/admin/footer", labelKey: "admin.nav.footer", icon: Handshake },
  { href: "/admin/media", labelKey: "admin.nav.media", icon: ImageIcon },
  { href: "/admin/inquiries", labelKey: "admin.nav.inquiries", icon: Inbox },
  { href: "/admin/users", labelKey: "admin.nav.users", icon: Shield }
];

export function AdminNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="admin-nav" aria-label={t("admin.navigation")}>
      <div className="admin-nav__group">
        <span className="admin-nav__label">{t("admin.groups.workspace")}</span>
        {links.slice(0, 4).map((item) => (
          <AdminNavItem item={item} pathname={pathname} t={t} key={item.href} />
        ))}
      </div>
      <div className="admin-nav__group">
        <span className="admin-nav__label">{t("admin.groups.content")}</span>
        {links.slice(4, 13).map((item) => (
          <AdminNavItem item={item} pathname={pathname} t={t} key={item.href} />
        ))}
      </div>
      <div className="admin-nav__group">
        <span className="admin-nav__label">{t("admin.groups.admin")}</span>
        {links.slice(13).map((item) => (
          <AdminNavItem item={item} pathname={pathname} t={t} key={item.href} />
        ))}
      </div>
      <LogoutButton>
        <LogOut size={18} />
        {t("admin.common.signOut")}
      </LogoutButton>
    </nav>
  );
}

function AdminNavItem({ item, pathname, t }: { item: AdminNavLink; pathname: string; t: (key: string) => string }) {
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link href={item.href} className={isActive ? "active" : undefined} aria-current={isActive ? "page" : undefined}>
      <Icon size={18} />
      {t(item.labelKey)}
    </Link>
  );
}
