import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { JobPostingTableActions } from "@/components/admin/JobPostingTableActions";
import { prisma } from "@/lib/db";

async function getJobs() {
  try {
    return await prisma.jobPosting.findMany({
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });
  } catch {
    return [];
  }
}

export default async function AdminCareersPage() {
  const jobs = await getJobs();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Careers</h1>
        <Link className="button" href="/admin/careers/new">
          New
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Status</th>
              <th>Applications</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.department}</td>
                <td>{job.location}</td>
                <td>
                  <span className="badge">{job.status}</span>
                </td>
                <td>
                  <Link href={`/admin/careers/${job.id}/applications`}>
                    {job._count.applications} application{job._count.applications === 1 ? "" : "s"}
                  </Link>
                </td>
                <td>{job.publishedAt ? job.publishedAt.toLocaleDateString() : "Not published"}</td>
                <td>
                  <JobPostingTableActions id={job.id} slug={job.slug} title={job.title} status={job.status} />
                </td>
              </tr>
            ))}
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={7}>No job postings yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
