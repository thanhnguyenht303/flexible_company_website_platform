import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const { services } = await getPublicSiteContext();
  const service = services.find((item) => item.slug === params.slug);
  if (!service) notFound();

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{service.name}</h2>
              <p>{service.summary}</p>
            </div>
          </div>
          <div className="card">
            <p>{service.description}</p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
