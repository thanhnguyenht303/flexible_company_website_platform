import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

async function getInquiries() {
  try {
    return await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  } catch {
    return [];
  }
}

export default async function AdminInquiriesPage() {
  const [inquiries, { t }] = await Promise.all([getInquiries(), getServerTranslations()]);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.common.inquiries")}</h1>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.common.name")}</th>
              <th>{t("admin.common.email")}</th>
              <th>{t("admin.common.status")}</th>
              <th>{t("admin.common.created")}</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id}>
                <td>{inquiry.name}</td>
                <td>{inquiry.email}</td>
                <td>
                  <span className="badge">{t(`admin.status.${inquiry.status}`)}</span>
                </td>
                <td>{inquiry.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={4}>{t("admin.empty.inquiries")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
