import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";

async function getInquiries() {
  try {
    return await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  } catch {
    return [];
  }
}

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Inquiries</h1>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id}>
                <td>{inquiry.name}</td>
                <td>{inquiry.email}</td>
                <td>
                  <span className="badge">{inquiry.status}</span>
                </td>
                <td>{inquiry.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
