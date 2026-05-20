import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function TeamPage() {
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
