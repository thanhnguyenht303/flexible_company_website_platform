import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ServicesPage() {
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
