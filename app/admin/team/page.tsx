import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AdminTeamPage() {
  const { team } = await getPublicSiteContext();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Team</h1>
        <button className="button" type="button">
          New
        </button>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Visible</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.name}>
                <td>{member.name}</td>
                <td>{member.position}</td>
                <td>
                  <span className="badge">Yes</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
