import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { localizeTeamMember } from "@/lib/i18n/content";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";
import { slugify } from "@/lib/slug";

export default async function TeamPage() {
  if (!(await isPublicPageVisible("team"))) notFound();

  const [{ team }, language] = await Promise.all([getPublicSiteContext(), getCurrentLanguage()]);
  const localizedTeam = team.map((member) => localizeTeamMember(member, language));

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{translate(language, "pages.team.title")}</h2>
              <p>{translate(language, "pages.team.description")}</p>
            </div>
          </div>
          <div className="grid">
            {localizedTeam.map((member) => (
              <Link className="card" href={`/team/${slugify(member.name)}`} key={member.name}>
                {"photoId" in member && member.photoId ? (
                  <div className="employee-card-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/${member.photoId}`} alt={member.name} />
                  </div>
                ) : null}
                <h3>{member.name}</h3>
                <p>
                  <strong>{member.position}</strong>
                </p>
                <p>{member.bio}</p>
              </Link>
            ))}
            {localizedTeam.length === 0 ? (
              <p className="message">No team members are visible yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
