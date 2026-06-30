import { AdminShell } from "@/components/admin/AdminShell";
import { PageVisibilitySettings } from "@/components/admin/PageVisibilitySettings";
import Link from "next/link";
import { getPublicPageVisibility } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AdminPagesPage() {
  const [{ sections }, pages] = await Promise.all([
    getPublicSiteContext(),
    getPublicPageVisibility()
  ]);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Pages</h1>
      </div>
      <PageVisibilitySettings pages={pages} />
      <div className="admin-panel">
        <h2>Visual Builder</h2>
        <p className="message">Edit website layout directly with draggable blocks, preview, draft save, and publish.</p>
        <div className="form-actions">
          <Link className="button" href="/admin/page-builder/home">
            Edit Homepage
          </Link>
          <Link className="button secondary" href="/">
            View Homepage
          </Link>
        </div>
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
