import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import { prisma } from "@/lib/db";

async function getMember(id: string) {
  try {
    return await prisma.teamMember.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Edit Employee</h1>
        <Link className="button secondary" href="/admin/team">
          Back
        </Link>
      </div>
      <TeamMemberForm
        member={{
          id: member.id,
          name: member.name,
          position: member.position,
          bio: member.bio,
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
