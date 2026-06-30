import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ServicesPage() {
  if (!(await isPublicPageVisible("services"))) notFound();

  const { services } = await getPublicSiteContext();

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Services</h2>
              <p>Service records can be drafted, published, archived, and rendered publicly.</p>
            </div>
          </div>
          <div className="grid">
            {services.map((service) => (
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
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
