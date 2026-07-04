import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { localizeService } from "@/lib/i18n/content";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ServicesPage() {
  if (!(await isPublicPageVisible("services"))) notFound();

  const [{ services }, language] = await Promise.all([getPublicSiteContext(), getCurrentLanguage()]);
  const localizedServices = services.map((service) => localizeService(service, language));

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{translate(language, "pages.services.title")}</h2>
              <p>{translate(language, "pages.services.description")}</p>
            </div>
          </div>
          <div className="grid">
            {localizedServices.map((service) => (
              <Link className="card" href={`/services/${service.slug}`} key={service.slug}>
                {"imageId" in service && service.imageId ? (
                  <div className="card-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/${service.imageId}`} alt="" />
                  </div>
                ) : null}
                <h3>{service.name}</h3>
                <p>{service.summary}</p>
              </Link>
            ))}
            {localizedServices.length === 0 ? (
              <p className="message">No services are published yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
