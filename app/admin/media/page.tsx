import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminMediaPage() {
  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Media</h1>
        <button className="button" type="button">
          Upload
        </button>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Type</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>placeholder-logo.svg</td>
              <td>image/svg+xml</td>
              <td>Built in</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
