import { notFound } from "next/navigation";
import { PublishStatus } from "@prisma/client";
import { JobApplicationForm } from "@/components/public/JobApplicationForm";
import { PublicShell } from "@/components/public/PublicShell";
import { ArticleContent } from "@/components/shared/ArticleContent";
import { prisma } from "@/lib/db";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
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

  const [job, language] = await Promise.all([getJob(slug), getCurrentLanguage()]);
  if (!job) notFound();

  return (
    <PublicShell>
      <article className="job-detail">
        <div className="container job-detail__layout">
          <main>
            <div className="article-kicker">{translate(language, "pages.careers.kicker")}</div>
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
              <h2>{translate(language, "pages.careers.aboutRole")}</h2>
              <ArticleContent content={job.description} />
            </section>
            {job.requirements ? (
              <section className="job-section">
                <h2>{translate(language, "pages.careers.requirements")}</h2>
                <ArticleContent content={job.requirements} />
              </section>
            ) : null}
          </main>
          <aside className="job-apply-panel">
            <JobApplicationForm jobId={job.id} jobTitle={job.title} />
            {job.applyUrl ? (
              <a className="button secondary" href={job.applyUrl}>
                {translate(language, "common.externalPosting")}
              </a>
            ) : null}
            {job.applyEmail ? (
              <p className="field-help">
                {translate(language, "pages.careers.alsoEmail", { email: job.applyEmail })}
              </p>
            ) : null}
          </aside>
        </div>
      </article>
    </PublicShell>
  );
}
