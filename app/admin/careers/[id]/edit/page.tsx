import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobPostingForm } from "@/components/admin/JobPostingForm";
import { prisma } from "@/lib/db";

async function getJob(id: string) {
  try {
    return await prisma.jobPosting.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function EditJobPostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Edit Job</h1>
        <Link className="button secondary" href="/admin/careers">
          Back
        </Link>
      </div>
      <JobPostingForm job={job} />
    </AdminShell>
  );
}
