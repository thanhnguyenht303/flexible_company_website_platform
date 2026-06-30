import { notFound } from "next/navigation";
import { PublishStatus } from "@prisma/client";
import { JobApplicationForm } from "@/components/public/JobApplicationForm";
import { PublicShell } from "@/components/public/PublicShell";
import { ArticleContent } from "@/components/shared/ArticleContent";
import { prisma } from "@/lib/db";
import { isPublicPageVisible } from "@/lib/page-visibility";

async function getJob(slug: string) {
  try {
    return await prisma.jobPosting.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED
      }
    });
  } catch {
    return null;
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await isPublicPageVisible("careers"))) notFound();

  const job = await getJob(slug);
  if (!job) notFound();

  return (
    <PublicShell>
      <article className="job-detail">
        <div className="container job-detail__layout">
          <main>
            <div className="article-kicker">Careers</div>
            <h1>{job.title}</h1>
            {job.summary ? <p className="article-deck">{job.summary}</p> : null}
            <div className="job-meta">
              {job.department ? <span>{job.department}</span> : null}
              {job.location ? <span>{job.location}</span> : null}
              {job.employmentType ? <span>{job.employmentType}</span> : null}
              {job.workMode ? <span>{job.workMode}</span> : null}
              {job.salaryRange ? <span>{job.salaryRange}</span> : null}
            </div>
            <section className="job-section">
              <h2>About The Role</h2>
              <ArticleContent content={job.description} />
            </section>
            {job.requirements ? (
              <section className="job-section">
                <h2>What We Are Looking For</h2>
                <ArticleContent content={job.requirements} />
              </section>
            ) : null}
          </main>
          <aside className="job-apply-panel">
            <JobApplicationForm jobId={job.id} jobTitle={job.title} />
            {job.applyUrl ? (
              <a className="button secondary" href={job.applyUrl}>
                External Posting
              </a>
            ) : null}
            {job.applyEmail ? (
              <p className="field-help">
                You can also email <a href={`mailto:${job.applyEmail}`}>{job.applyEmail}</a>.
              </p>
            ) : null}
          </aside>
        </div>
      </article>
    </PublicShell>
  );
}
