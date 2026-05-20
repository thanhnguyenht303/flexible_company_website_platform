import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";

async function getUsers() {
  try {
    return await prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "asc" } });
  } catch {
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Users</h1>
        <button className="button" type="button">
          Invite
        </button>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role.name}</td>
                <td>
                  <span className="badge">{user.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
