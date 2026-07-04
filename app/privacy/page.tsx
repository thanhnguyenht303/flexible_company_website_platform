import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";

export default async function PrivacyPage() {
  if (!(await isPublicPageVisible("privacy"))) notFound();
  const language = await getCurrentLanguage();

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{translate(language, "pages.privacy.title")}</h2>
              <p>{translate(language, "pages.privacy.description")}</p>
            </div>
          </div>
          <div className="card">
            <p>{translate(language, "pages.privacy.body")}</p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
