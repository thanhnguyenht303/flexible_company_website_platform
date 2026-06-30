import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";

export default function NewTeamMemberPage() {
  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>New Employee</h1>
        <Link className="button secondary" href="/admin/team">
          Back
        </Link>
      </div>
      <TeamMemberForm />
    </AdminShell>
  );
}
