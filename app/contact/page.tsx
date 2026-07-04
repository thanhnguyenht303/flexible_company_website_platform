import { notFound } from "next/navigation";
import { ContactForm } from "@/components/public/ContactForm";
import { PublicShell } from "@/components/public/PublicShell";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ContactPage() {
  if (!(await isPublicPageVisible("contact"))) notFound();

  const [{ site }, language] = await Promise.all([getPublicSiteContext(), getCurrentLanguage()]);

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{translate(language, "pages.contact.title")}</h2>
              <p>
                {site.email
                  ? translate(language, "pages.contact.emailLead", { email: site.email })
                  : translate(language, "pages.contact.description")}
              </p>
            </div>
          </div>
          <div className="grid">
            <ContactForm />
            <div className="admin-panel">
              <h2>{site.siteName}</h2>
              <p>{site.address}</p>
              <p>{site.phone}</p>
              <p>{site.email}</p>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
