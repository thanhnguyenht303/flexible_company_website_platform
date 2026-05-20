import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ProductsPage() {
  const { products } = await getPublicSiteContext();

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Products</h2>
              <p>Publish products with descriptions, SEO metadata, images, galleries, and specs.</p>
            </div>
          </div>
          <div className="grid">
            {products.map((product) => (
              <Link className="card" href={`/products/${product.slug}`} key={product.slug}>
                <h3>{product.name}</h3>
                <p>{product.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
