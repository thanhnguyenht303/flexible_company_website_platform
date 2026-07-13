import { AdminShell } from "@/components/admin/AdminShell";
import { UserManagement } from "@/components/admin/UserManagement";
import { requireAdminAuthority } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminUsersPage() {
  const currentUser = await requireAdminAuthority("users.manage");
  const [users, roles] = await Promise.all([
    prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "asc" } }),
    prisma.role.findMany({ orderBy: [{ isSystem: "desc" }, { name: "asc" }] })
  ]);

  return (
    <AdminShell requiredAuthority="users.manage">
      <UserManagement
        currentUserId={currentUser.id}
        roles={roles.map(({ id, name }) => ({ id, name }))}
        users={users.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          role: { id: user.role.id, name: user.role.name }
        }))}
      />
    </AdminShell>
  );
}
