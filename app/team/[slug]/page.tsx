import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { localizeTeamMember } from "@/lib/i18n/content";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";
import { slugify } from "@/lib/slug";

export default async function TeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isPublicPageVisible("team"))) notFound();

  const { slug } = await params;
  const [{ team }, language] = await Promise.all([getPublicSiteContext(), getCurrentLanguage()]);
  const memberRecord = team.find((item) => {
    const id = "id" in item && typeof item.id === "string" ? item.id : null;
    return id === slug || slugify(item.name) === slug;
  });

  if (!memberRecord) notFound();

  const member = localizeTeamMember(memberRecord, language);
  const email = "email" in member && typeof member.email === "string" ? member.email : null;
  const phone = "phone" in member && typeof member.phone === "string" ? member.phone : null;
  const photoId = "photoId" in member && typeof member.photoId === "string" ? member.photoId : null;

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <article className="team-detail">
            {photoId ? (
              <div className="team-detail__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/media/${photoId}`} alt="" />
              </div>
            ) : null}
            <div className="team-detail__content">
              <p className="article-kicker">{translate(language, "pages.team.title")}</p>
              <h1>{member.name}</h1>
              {member.position ? <p className="team-detail__position">{member.position}</p> : null}
              {member.bio ? <p>{member.bio}</p> : null}
              {email || phone ? (
                <div className="team-detail__contact">
                  {email ? <a className="button secondary" href={`mailto:${email}`}>{email}</a> : null}
                  {phone ? <a className="button secondary" href={`tel:${phone}`}>{phone}</a> : null}
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </PublicShell>
  );
}
