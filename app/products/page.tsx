import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { localizeProduct } from "@/lib/i18n/content";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translations";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ProductsPage() {
  if (!(await isPublicPageVisible("products"))) notFound();

  const [{ products }, language] = await Promise.all([getPublicSiteContext(), getCurrentLanguage()]);
  const localizedProducts = products.map((product) => localizeProduct(product, language));

  return (
    <PublicShell>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{translate(language, "pages.products.title")}</h2>
              <p>{translate(language, "pages.products.description")}</p>
            </div>
          </div>
          <div className="grid">
            {localizedProducts.map((product) => (
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
            {localizedProducts.length === 0 ? (
              <p className="message">No products are published yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
