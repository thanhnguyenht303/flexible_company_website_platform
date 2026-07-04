import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AboutPage() {
  if (!(await isPublicPageVisible("about"))) notFound();

  const [{ site }, language] = await Promise.all([getPublicSiteContext(), getCurrentLanguage()]);

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{translate(language, "pages.about.title", { siteName: site.siteName })}</h2>
              <p>{site.description}</p>
            </div>
          </div>
          <div className="grid">
            <div className="card">
              <h3>{translate(language, "pages.about.reusableTitle")}</h3>
              <p>{translate(language, "pages.about.reusableText")}</p>
            </div>
            <div className="card">
              <h3>{translate(language, "pages.about.configurableTitle")}</h3>
              <p>{translate(language, "pages.about.configurableText")}</p>
            </div>
            <div className="card">
              <h3>{translate(language, "pages.about.extendableTitle")}</h3>
              <p>{translate(language, "pages.about.extendableText")}</p>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
