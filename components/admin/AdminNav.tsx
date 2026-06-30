"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import {
  BarChart3,
  Briefcase,
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
  Wrench
} from "lucide-react";

type AdminNavLink = {
  href: string;
  label: string;
  icon: ComponentType<LucideProps>;
};

const links: AdminNavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/settings/site", label: "Site Settings", icon: Settings },
  { href: "/admin/settings/theme", label: "Theme", icon: Palette },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/posts", label: "Posts", icon: BarChart3 },
  { href: "/admin/careers", label: "Careers", icon: Briefcase },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/footer", label: "Footer", icon: Handshake },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/users", label: "Users", icon: Shield }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <div className="admin-nav__group">
        <span className="admin-nav__label">Workspace</span>
        {links.slice(0, 4).map((item) => (
          <AdminNavItem item={item} pathname={pathname} key={item.href} />
        ))}
      </div>
      <div className="admin-nav__group">
        <span className="admin-nav__label">Content</span>
        {links.slice(4, 10).map((item) => (
          <AdminNavItem item={item} pathname={pathname} key={item.href} />
        ))}
      </div>
      <div className="admin-nav__group">
        <span className="admin-nav__label">Admin</span>
        {links.slice(10).map((item) => (
          <AdminNavItem item={item} pathname={pathname} key={item.href} />
        ))}
      </div>
      <LogoutButton>
        <LogOut size={18} />
        Sign out
      </LogoutButton>
    </nav>
  );
}

function AdminNavItem({ item, pathname }: { item: AdminNavLink; pathname: string }) {
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link href={item.href} className={isActive ? "active" : undefined} aria-current={isActive ? "page" : undefined}>
      <Icon size={18} />
      {item.label}
    </Link>
  );
}
