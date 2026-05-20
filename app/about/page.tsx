import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AboutPage() {
  const { site } = await getPublicSiteContext();

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>About {site.siteName}</h2>
              <p>{site.description}</p>
            </div>
          </div>
          <div className="grid">
            <div className="card">
              <h3>Reusable</h3>
              <p>One codebase can power many company websites with brand and content changes.</p>
            </div>
            <div className="card">
              <h3>Configurable</h3>
              <p>Admins can manage settings, pages, modules, theme, SEO, media, and inquiries.</p>
            </div>
            <div className="card">
              <h3>Extendable</h3>
              <p>Modules are separated so new business features can be added cleanly later.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
