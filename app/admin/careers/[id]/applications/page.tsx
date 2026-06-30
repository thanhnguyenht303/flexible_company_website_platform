import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";

async function getJobWithApplications(id: string) {
  return prisma.jobPosting.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          resumeFile: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}

export default async function JobApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobWithApplications(id);
  if (!job) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <div>
          <h1>Applications</h1>
          <p className="message">
            {job.title} has {job.applications.length} application{job.applications.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link className="button secondary" href="/admin/careers">
          Back
        </Link>
      </div>

      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Contact</th>
              <th>Company</th>
              <th>Submitted</th>
              <th>Resume</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {job.applications.map((application) => (
              <tr key={application.id}>
                <td>
                  <strong>{application.name}</strong>
                  <div className="message">{application.status}</div>
                </td>
                <td>
                  <a href={`mailto:${application.email}`}>{application.email}</a>
                  {application.phone ? <div>{application.phone}</div> : null}
                </td>
                <td>{application.companyName || "Not provided"}</td>
                <td>{application.createdAt.toLocaleString()}</td>
                <td>
                  {application.resumeFile ? (
                    <a className="button secondary" href={application.resumeFile.url} target="_blank" rel="noreferrer">
                      View Resume
                    </a>
                  ) : (
                    "Missing file"
                  )}
                </td>
                <td>{application.message || "No note"}</td>
              </tr>
            ))}
            {job.applications.length === 0 ? (
              <tr>
                <td colSpan={6}>No applications for this position yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
