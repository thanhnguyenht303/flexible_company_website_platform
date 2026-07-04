import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

async function getUsers() {
  try {
    return await prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "asc" } });
  } catch {
    return [];
  }
}

export default async function AdminUsersPage() {
  const [users, { t }] = await Promise.all([getUsers(), getServerTranslations()]);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.common.users")}</h1>
        <button className="button" type="button">
          {t("admin.common.invite")}
        </button>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.common.username")}</th>
              <th>{t("admin.common.email")}</th>
              <th>{t("admin.common.role")}</th>
              <th>{t("admin.common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role.name}</td>
                <td>
                  <span className="badge">{t(`admin.status.${user.status}`)}</span>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={4}>{t("admin.empty.users")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
