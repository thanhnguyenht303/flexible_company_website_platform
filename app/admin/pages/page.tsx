import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AdminPagesPage() {
  const { sections } = await getPublicSiteContext();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Pages</h1>
        <button className="button" type="button">
          New
        </button>
      </div>
      <div className="admin-panel">
        <h2>Homepage Sections</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Type</th>
              <th>Visible</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={`${section.type}-${section.sortOrder}`}>
                <td>{section.sortOrder}</td>
                <td>{section.type}</td>
                <td>
                  <span className="badge">{section.enabled ? "Yes" : "No"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
