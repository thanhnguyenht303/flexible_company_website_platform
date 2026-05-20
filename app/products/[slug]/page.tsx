import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { products } = await getPublicSiteContext();
  const product = products.find((item) => item.slug === params.slug);
  if (!product) notFound();

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{product.name}</h2>
              <p>{product.summary}</p>
            </div>
          </div>
          <div className="card">
            <p>{product.description}</p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
