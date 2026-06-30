import Link from "next/link";
import { notFound } from "next/navigation";
import { PublishStatus } from "@prisma/client";
import { PublicShell } from "@/components/public/PublicShell";
import { prisma } from "@/lib/db";
import { isPublicPageVisible } from "@/lib/page-visibility";

async function getPublishedJobs() {
  try {
    return await prisma.jobPosting.findMany({
      where: { status: PublishStatus.PUBLISHED },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
    });
  } catch {
    return [];
  }
}

export default async function CareersPage() {
  if (!(await isPublicPageVisible("careers"))) notFound();

  const jobs = await getPublishedJobs();

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Careers</h2>
              <p>Explore current openings and apply to join the team.</p>
            </div>
          </div>
          <div className="job-list">
            {jobs.map((job) => (
              <Link className="job-card" href={`/careers/${job.slug}`} key={job.id}>
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.summary}</p>
                </div>
                <div className="job-meta">
                  {job.department ? <span>{job.department}</span> : null}
                  {job.location ? <span>{job.location}</span> : null}
                  {job.employmentType ? <span>{job.employmentType}</span> : null}
                  {job.workMode ? <span>{job.workMode}</span> : null}
                </div>
              </Link>
            ))}
            {jobs.length === 0 ? (
              <div className="card">
                <h3>No open roles right now</h3>
                <p>Please check back later for new opportunities.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
