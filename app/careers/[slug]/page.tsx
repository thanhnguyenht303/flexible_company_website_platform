import Link from "next/link";
import { notFound } from "next/navigation";
import { PublishStatus } from "@prisma/client";
import { JobApplicationForm } from "@/components/public/JobApplicationForm";
import { PublicShell } from "@/components/public/PublicShell";
import { ArticleContent } from "@/components/shared/ArticleContent";
import { getCareerThemeFromSite, getCareerThemeStyle } from "@/lib/career-theme";
import { prisma } from "@/lib/db";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";

async function getJob(slug: string) {
  try {
    const [job, site] = await Promise.all([
      prisma.jobPosting.findFirst({
        where: {
          slug,
          status: PublishStatus.PUBLISHED
        }
      }),
      prisma.siteSetting.findFirst({ select: { defaultSeo: true } })
    ]);

    return { job, site: site ?? {} };
  } catch {
    return { job: null, site: {} };
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await isPublicPageVisible("careers"))) notFound();

  const [{ job, site }, language] = await Promise.all([getJob(slug), getCurrentLanguage()]);
  if (!job) notFound();
  const careerTheme = getCareerThemeFromSite(site);

  return (
    <PublicShell pageSlug="careers">
      <article className="career-page job-detail" style={getCareerThemeStyle(careerTheme)}>
        <div className="container job-detail__layout">
          <main className="job-detail__main">
            <nav className="career-breadcrumb" aria-label={translate(language, "pages.careers.breadcrumbLabel")}>
              <Link href="/careers">{translate(language, "pages.careers.title")}</Link>
              <span aria-hidden="true">/</span>
              <span>{job.title}</span>
            </nav>
            <header className="job-detail__hero">
              <p className="article-kicker">{translate(language, "pages.careers.kicker")}</p>
              <h1>{job.title}</h1>
              {job.summary ? <p className="article-deck">{job.summary}</p> : null}
              <div className="job-meta">
                {job.department ? <span>{job.department}</span> : null}
                {job.location ? <span>{job.location}</span> : null}
                {job.employmentType ? <span>{job.employmentType}</span> : null}
                {job.workMode ? <span>{job.workMode}</span> : null}
                {job.salaryRange ? <span>{job.salaryRange}</span> : null}
              </div>
              <a className="button" href="#apply">{translate(language, "common.apply")}</a>
            </header>
            <section className="career-story job-detail__process" aria-label={translate(language, "pages.careers.processLabel")}>
              <span>{translate(language, "pages.careers.processStepOne")}</span>
              <span>{translate(language, "pages.careers.processStepTwo")}</span>
              <span>{translate(language, "pages.careers.processStepThree")}</span>
            </section>
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
          <aside className="job-apply-panel" id="apply" aria-label={translate(language, "forms.job.applyFor", { jobTitle: job.title })}>
            <div className="career-apply-note">
              <p className="article-kicker">{translate(language, "pages.careers.readyToApply")}</p>
              <p>{translate(language, "pages.careers.applyPanelText")}</p>
            </div>
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
