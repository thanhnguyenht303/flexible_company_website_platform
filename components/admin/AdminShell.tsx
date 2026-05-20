import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  FileText,
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
import { requireAdminUser } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/settings/site", label: "Site Settings", icon: Settings },
  { href: "/admin/settings/theme", label: "Theme", icon: Palette },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/posts", label: "Posts", icon: BarChart3 },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/users", label: "Users", icon: Shield }
];

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="brand">
          <Image src="/placeholder-logo.svg" alt="" width={34} height={34} />
          <span>CMS Admin</span>
        </Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <LogoutButton>
            <LogOut size={18} />
            Sign out
          </LogoutButton>
        </nav>
        <p className="message">Signed in as {user.displayName ?? user.username}</p>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
