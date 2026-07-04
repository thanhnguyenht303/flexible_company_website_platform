import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeamTableActions } from "@/components/admin/TeamTableActions";
import { prisma } from "@/lib/db";
import { localizedField } from "@/lib/i18n/content";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

async function getTeam() {
  return prisma.teamMember.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
}

export default async function AdminTeamPage() {
  const [team, { language, t }] = await Promise.all([getTeam(), getServerTranslations()]);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.common.team")}</h1>
        <Link className="button" href="/admin/team/new">
          {t("admin.common.new")}
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.common.image")}</th>
              <th>{t("admin.common.name")}</th>
              <th>{t("admin.common.position")}</th>
              <th>{t("admin.common.description")}</th>
              <th>{t("admin.common.sort")}</th>
              <th>{t("admin.common.visible")}</th>
              <th>{t("admin.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => {
              const position = localizedField(member, "position", language);
              const bio = localizedField(member, "bio", language);
              return (
                <tr key={member.id}>
                  <td>
                    {member.photoId ? (
                      <div className="employee-table-photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/media/${member.photoId}`} alt="" />
                      </div>
                    ) : (
                      t("admin.common.none")
                    )}
                  </td>
                  <td>{member.name}</td>
                  <td>{position}</td>
                  <td>{bio ? `${bio.slice(0, 90)}${bio.length > 90 ? "..." : ""}` : ""}</td>
                  <td>{member.sortOrder}</td>
                  <td>
                    <span className="badge">{member.isVisible ? t("admin.common.yes") : t("admin.common.no")}</span>
                  </td>
                  <td>
                    <TeamTableActions id={member.id} title={member.name} isVisible={member.isVisible} />
                  </td>
                </tr>
              );
            })}
            {team.length === 0 ? (
              <tr>
                <td colSpan={7}>{t("admin.empty.employees")}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
