import { notFound } from "next/navigation";
import { ContactForm } from "@/components/public/ContactForm";
import { PublicShell } from "@/components/public/PublicShell";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ContactPage() {
  if (!(await isPublicPageVisible("contact"))) notFound();

  const { site } = await getPublicSiteContext();

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Contact</h2>
              <p>{site.email ? `Email ${site.email}` : "Send a message to the company team."}</p>
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
