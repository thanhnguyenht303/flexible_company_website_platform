import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobPostingForm } from "@/components/admin/JobPostingForm";

export default function NewJobPostingPage() {
  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>New Job</h1>
        <Link className="button secondary" href="/admin/careers">
          Back
        </Link>
      </div>
      <JobPostingForm />
    </AdminShell>
  );
}
