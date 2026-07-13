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
    <AdminShell requiredAuthority="inquiries.manage">
      <div className="admin-page-header">
        <h1>{t("admin.common.inquiries")}</h1>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("admin.common.name")}</th>
              <th scope="col">{t("admin.common.email")}</th>
              <th scope="col">{t("admin.common.status")}</th>
              <th scope="col">{t("admin.common.created")}</th>
              <th scope="col">{t("admin.common.actions")}</th>
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
                <td><a className="button secondary" href={`/admin/inquiries/${inquiry.id}`}>{t("admin.common.edit")}</a></td>
              </tr>
            ))}
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={5}>{t("admin.empty.inquiries")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
