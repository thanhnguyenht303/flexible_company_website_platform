import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { products } = await getPublicSiteContext();
  const product = products.find((item) => item.slug === params.slug);
  if (!product) notFound();
  const galleryIds = "gallery" in product ? getGalleryIds(product.gallery) : [];

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
          {galleryIds.length ? (
            <div className="product-gallery">
              <div className="product-gallery__main">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/media/${galleryIds[0]}`} alt="" />
              </div>
              {galleryIds.length > 1 ? (
                <div className="product-gallery__thumbs">
                  {galleryIds.slice(1).map((imageId) => (
                    <div className="product-gallery__thumb" key={imageId}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/media/${imageId}`} alt="" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="card">
            <p>{product.description}</p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function getGalleryIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
