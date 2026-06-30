import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeamTableActions } from "@/components/admin/TeamTableActions";
import { prisma } from "@/lib/db";

async function getTeam() {
  try {
    return await prisma.teamMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });
  } catch {
    return [];
  }
}

export default async function AdminTeamPage() {
  const team = await getTeam();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Team</h1>
        <Link className="button" href="/admin/team/new">
          New
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Position</th>
              <th>Description</th>
              <th>Sort</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.id}>
                <td>
                  {member.photoId ? (
                    <div className="employee-table-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/media/${member.photoId}`} alt="" />
                    </div>
                  ) : (
                    "None"
                  )}
                </td>
                <td>{member.name}</td>
                <td>{member.position}</td>
                <td>{member.bio ? `${member.bio.slice(0, 90)}${member.bio.length > 90 ? "..." : ""}` : ""}</td>
                <td>{member.sortOrder}</td>
                <td>
                  <span className="badge">{member.isVisible ? "Yes" : "No"}</span>
                </td>
                <td>
                  <TeamTableActions id={member.id} title={member.name} isVisible={member.isVisible} />
                </td>
              </tr>
            ))}
            {team.length === 0 ? (
              <tr>
                <td colSpan={7}>No employees yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
