import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

async function getMember(id: string) {
  try {
    return await prisma.teamMember.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [member, { t }] = await Promise.all([getMember(id), getServerTranslations()]);
  if (!member) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.pageTitles.editEmployee")}</h1>
        <Link className="button secondary" href="/admin/team">
          {t("admin.common.back")}
        </Link>
      </div>
      <TeamMemberForm
        member={{
          id: member.id,
          name: member.name,
          position: member.position,
          positionVi: member.positionVi,
          bio: member.bio,
          bioVi: member.bioVi,
          email: member.email,
          phone: member.phone,
          sortOrder: member.sortOrder,
          isVisible: member.isVisible,
          photoId: member.photoId
        }}
      />
    </AdminShell>
  );
}
