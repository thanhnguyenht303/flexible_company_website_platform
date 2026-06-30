import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ProductsPage() {
  if (!(await isPublicPageVisible("products"))) notFound();

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
                {"imageId" in product && product.imageId ? (
                  <div className="card-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/${product.imageId}`} alt="" />
                  </div>
                ) : null}
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
