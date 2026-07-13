"use client";

import { useEffect, useRef, useState } from "react";
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
  Mail,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Package,
  Palette,
  Settings,
  Shield,
  Users,
  UserRoundCheck,
  Wrench
} from "lucide-react";
import type { AuthorityKey } from "@/config/admin-authorities";

type AdminNavLink = {
  href: string;
  labelKey: string;
  icon: ComponentType<LucideProps>;
  requiredAuthority: AuthorityKey;
};

const links: AdminNavLink[] = [
  { href: "/admin/dashboard", labelKey: "admin.nav.dashboard", icon: LayoutDashboard, requiredAuthority: "dashboard.view" },
  { href: "/admin/settings/site", labelKey: "admin.nav.siteSettings", icon: Settings, requiredAuthority: "siteSettings.manage" },
  { href: "/admin/settings/theme", labelKey: "admin.nav.theme", icon: Palette, requiredAuthority: "theme.manage" },
  { href: "/admin/pages", labelKey: "admin.nav.pages", icon: FileText, requiredAuthority: "pages.manage" },
  { href: "/admin/services", labelKey: "admin.nav.services", icon: Wrench, requiredAuthority: "services.manage" },
  { href: "/admin/products", labelKey: "admin.nav.products", icon: Package, requiredAuthority: "products.manage" },
  { href: "/admin/posts", labelKey: "admin.nav.posts", icon: BarChart3, requiredAuthority: "posts.manage" },
  { href: "/admin/careers", labelKey: "admin.nav.careers", icon: Briefcase, requiredAuthority: "careers.manage" },
  { href: "/admin/forms", labelKey: "admin.nav.forms", icon: ClipboardList, requiredAuthority: "forms.manage" },
  { href: "/admin/leads", labelKey: "admin.nav.leads", icon: UserRoundCheck, requiredAuthority: "leads.manage" },
  { href: "/admin/qa", labelKey: "admin.nav.qa", icon: CircleHelp, requiredAuthority: "qa.manage" },
  { href: "/admin/team", labelKey: "admin.nav.team", icon: Users, requiredAuthority: "team.manage" },
  { href: "/admin/footer", labelKey: "admin.nav.footer", icon: Handshake, requiredAuthority: "footer.manage" },
  { href: "/admin/media", labelKey: "admin.nav.media", icon: ImageIcon, requiredAuthority: "media.manage" },
  { href: "/admin/inquiries", labelKey: "admin.nav.inquiries", icon: Inbox, requiredAuthority: "inquiries.manage" },
  { href: "/admin/email", labelKey: "admin.nav.email", icon: Mail, requiredAuthority: "email.manage" },
  { href: "/admin/users", labelKey: "admin.nav.users", icon: Shield, requiredAuthority: "users.manage" },
  { href: "/admin/roles", labelKey: "admin.nav.roles", icon: Shield, requiredAuthority: "roles.manage" }
];

export function AdminNav({ authorityKeys }: { authorityKeys: AuthorityKey[] }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const visibleLinks = links.filter((link) => authorityKeys.includes(link.requiredAuthority));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOnDesktop = () => {
      if (window.matchMedia("(min-width: 901px)").matches) setOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [open]);

  return (
    <>
      <button className="admin-nav__toggle" type="button" aria-controls="admin-navigation" aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu size={18} aria-hidden="true" />
        {t("admin.navigation")}
      </button>
      {open ? <button className="admin-nav__backdrop" type="button" aria-hidden="true" tabIndex={-1} onClick={() => setOpen(false)} /> : null}
      <nav id="admin-navigation" className={`admin-nav${open ? " is-open" : ""}`} aria-label={t("admin.navigation")}>
        <div className="admin-nav__drawer-head">
          <strong>{t("admin.navigation")}</strong>
          <button ref={closeButtonRef} type="button" aria-label={t("admin.closeNavigation")} onClick={() => setOpen(false)}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="admin-nav__group">
          <span className="admin-nav__label">{t("admin.groups.workspace")}</span>
          {visibleLinks.filter((item) => links.indexOf(item) < 4).map((item) => (
            <AdminNavItem item={item} pathname={pathname} t={t} key={item.href} />
          ))}
        </div>
        <div className="admin-nav__group">
          <span className="admin-nav__label">{t("admin.groups.content")}</span>
          {visibleLinks.filter((item) => links.indexOf(item) >= 4 && links.indexOf(item) < 13).map((item) => (
            <AdminNavItem item={item} pathname={pathname} t={t} key={item.href} />
          ))}
        </div>
        <div className="admin-nav__group">
          <span className="admin-nav__label">{t("admin.groups.admin")}</span>
          {visibleLinks.filter((item) => links.indexOf(item) >= 13).map((item) => (
            <AdminNavItem item={item} pathname={pathname} t={t} key={item.href} />
          ))}
        </div>
        <LogoutButton>
          <LogOut size={18} />
          {t("admin.common.signOut")}
        </LogoutButton>
      </nav>
    </>
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
