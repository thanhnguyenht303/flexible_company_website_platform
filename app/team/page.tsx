import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function TeamPage() {
  if (!(await isPublicPageVisible("team"))) notFound();

  const { team } = await getPublicSiteContext();

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Team</h2>
              <p>Employee profiles are sortable and can be hidden without deleting records.</p>
            </div>
          </div>
          <div className="grid">
            {team.map((member) => (
              <article className="card" key={member.name}>
                {"photoId" in member && member.photoId ? (
                  <div className="employee-card-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/${member.photoId}`} alt="" />
                  </div>
                ) : null}
                <h3>{member.name}</h3>
                <p>
                  <strong>{member.position}</strong>
                </p>
                <p>{member.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
