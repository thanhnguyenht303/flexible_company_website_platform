import Link from "next/link";
import { notFound } from "next/navigation";
import { PublishStatus } from "@prisma/client";
import { PublicShell } from "@/components/public/PublicShell";
import { getCareerThemeFromSite, getCareerThemeStyle } from "@/lib/career-theme";
import { prisma } from "@/lib/db";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";

async function getCareerData() {
  try {
    const [jobs, site] = await Promise.all([
      prisma.jobPosting.findMany({
        where: { status: PublishStatus.PUBLISHED },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
      }),
      prisma.siteSetting.findFirst({ select: { defaultSeo: true } })
    ]);

    return { jobs, site: site ?? {} };
  } catch {
    return { jobs: [], site: {} };
  }
}

export default async function CareersPage({ searchParams }: { searchParams: Promise<{ q?: string; department?: string; location?: string }> }) {
  if (!(await isPublicPageVisible("careers"))) notFound();

  const [{ jobs, site }, language, params] = await Promise.all([getCareerData(), getCurrentLanguage(), searchParams]);
  const query = params.q?.trim().toLowerCase() ?? "";
  const selectedDepartment = params.department?.trim() ?? "";
  const selectedLocation = params.location?.trim() ?? "";
  const departments = [...new Set(jobs.map((job) => job.department).filter(Boolean) as string[])].sort();
  const locations = [...new Set(jobs.map((job) => job.location).filter(Boolean) as string[])].sort();
  const filteredJobs = jobs.filter((job) => {
    const matchesQuery = query
      ? [job.title, job.summary, job.description, job.department, job.location, job.employmentType, job.workMode]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query))
      : true;
    const matchesDepartment = selectedDepartment ? job.department === selectedDepartment : true;
    const matchesLocation = selectedLocation ? job.location === selectedLocation : true;

    return matchesQuery && matchesDepartment && matchesLocation;
  });
  const hasActiveFilters = Boolean(query || selectedDepartment || selectedLocation);
  const careerTheme = getCareerThemeFromSite(site);
  const resultCopy =
    filteredJobs.length === 1
      ? translate(language, "pages.careers.roleCountSingular")
      : translate(language, "pages.careers.roleCountPlural", { count: filteredJobs.length });
  const featuredJob = filteredJobs[0] ?? jobs[0] ?? null;

  return (
    <PublicShell pageSlug="careers">
      <main className="career-page" style={getCareerThemeStyle(careerTheme)}>
        <section className="career-hero" aria-labelledby="career-title">
          <div className="career-hero__copy">
            <p className="article-kicker">{translate(language, "pages.careers.kicker")}</p>
            <h1 id="career-title">{translate(language, "pages.careers.title")}</h1>
            <p>{translate(language, "pages.careers.description")}</p>
          </div>
          <form className="career-search" action="/careers" role="search" aria-label={translate(language, "pages.careers.searchLabel")}>
            <div className="field career-search__query">
              <label htmlFor="q">{translate(language, "common.search")}</label>
              <input id="q" name="q" type="search" defaultValue={params.q ?? ""} placeholder={translate(language, "pages.careers.searchPlaceholder")} />
            </div>
            <div className="field">
              <label htmlFor="department">{translate(language, "admin.common.department")}</label>
              <select id="department" name="department" defaultValue={selectedDepartment}>
                <option value="">{translate(language, "formsFeature.common.all")}</option>
                {departments.map((department) => <option value={department} key={department}>{department}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="location">{translate(language, "admin.common.location")}</label>
              <select id="location" name="location" defaultValue={selectedLocation}>
                <option value="">{translate(language, "formsFeature.common.all")}</option>
                {locations.map((location) => <option value={location} key={location}>{location}</option>)}
              </select>
            </div>
            <div className="form-actions career-search__actions">
              <button className="button" type="submit">{translate(language, "formsFeature.common.filter")}</button>
              {hasActiveFilters ? <Link className="button secondary" href="/careers">{translate(language, "formsFeature.common.reset")}</Link> : null}
            </div>
          </form>
          <div className="career-hero__stats" aria-label={translate(language, "pages.careers.summaryLabel")}>
            <span><strong>{jobs.length}</strong>{translate(language, "pages.careers.openRolesStat")}</span>
            <span><strong>{departments.length}</strong>{translate(language, "pages.careers.teamsStat")}</span>
            <span><strong>{locations.length}</strong>{translate(language, "pages.careers.locationsStat")}</span>
          </div>
        </section>

        <section className="career-story" aria-label={translate(language, "pages.careers.storyLabel")}>
          <div>
            <p className="article-kicker">{translate(language, "pages.careers.storyKicker")}</p>
            <h2>{translate(language, "pages.careers.storyTitle")}</h2>
          </div>
          <div className="career-story__steps">
            <span>{translate(language, "pages.careers.storyStepOne")}</span>
            <span>{translate(language, "pages.careers.storyStepTwo")}</span>
            <span>{translate(language, "pages.careers.storyStepThree")}</span>
          </div>
        </section>

        {featuredJob ? (
          <section className="career-featured" aria-labelledby="career-featured-title">
            <div>
              <p className="article-kicker">{translate(language, "pages.careers.featuredRole")}</p>
              <h2 id="career-featured-title">{featuredJob.title}</h2>
              {featuredJob.summary ? <p>{featuredJob.summary}</p> : null}
              <div className="job-meta">
                {featuredJob.department ? <span>{featuredJob.department}</span> : null}
                {featuredJob.location ? <span>{featuredJob.location}</span> : null}
                {featuredJob.employmentType ? <span>{featuredJob.employmentType}</span> : null}
                {featuredJob.workMode ? <span>{featuredJob.workMode}</span> : null}
              </div>
            </div>
            <Link className="button" href={`/careers/${featuredJob.slug}`}>{translate(language, "pages.careers.viewRole")}</Link>
          </section>
        ) : null}

        <section className="career-results" aria-labelledby="career-results-title">
          <div className="career-section-head">
            <div>
              <p className="article-kicker">{translate(language, "pages.careers.openRoles")}</p>
              <h2 id="career-results-title">{resultCopy}</h2>
            </div>
            <p className="message" aria-live="polite">
              {query ? translate(language, "pages.careers.showingSearch", { query: params.q?.trim() ?? "" }) : translate(language, "pages.careers.showingAll")}
            </p>
          </div>
          <div className="job-list">
            {filteredJobs.map((job) => (
              <Link className="job-card" href={`/careers/${job.slug}`} key={job.id}>
                <span className="job-card__eyebrow">{job.department || translate(language, "pages.careers.generalTeam")}</span>
                <div>
                  <h3>{job.title}</h3>
                  {job.summary ? <p>{job.summary}</p> : null}
                </div>
                <div className="job-meta">
                  {job.location ? <span>{job.location}</span> : null}
                  {job.employmentType ? <span>{job.employmentType}</span> : null}
                  {job.workMode ? <span>{job.workMode}</span> : null}
                  {job.salaryRange ? <span>{job.salaryRange}</span> : null}
                </div>
                <span className="job-card__action">{translate(language, "pages.careers.viewRole")}</span>
              </Link>
            ))}
            {filteredJobs.length === 0 ? (
              <div className="empty-state career-empty-state">
                <strong>{hasActiveFilters ? translate(language, "pages.careers.noResultsTitle") : translate(language, "pages.careers.emptyTitle")}</strong>
                <span>{hasActiveFilters ? translate(language, "pages.careers.noResultsText") : translate(language, "pages.careers.emptyText")}</span>
                {hasActiveFilters ? <Link className="button secondary" href="/careers">{translate(language, "pages.careers.clearFilters")}</Link> : null}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
