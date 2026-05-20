import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AdminServicesPage() {
  const { services } = await getPublicSiteContext();
  return <AdminListPage title="Services" rows={services} />;
}

function AdminListPage({ title, rows }: { title: string; rows: Array<{ name: string; slug: string }> }) {
  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{title}</h1>
        <button className="button" type="button">
          New
        </button>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug}>
                <td>{row.name}</td>
                <td>{row.slug}</td>
                <td>
                  <span className="badge">Published</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
