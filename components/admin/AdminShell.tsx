import Image from "next/image";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="brand">
          <Image src="/placeholder-logo.svg" alt="" width={34} height={34} />
          <span>CMS Admin</span>
        </Link>
        <AdminNav />
        <p className="message">Signed in as {user.displayName ?? user.username}</p>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
