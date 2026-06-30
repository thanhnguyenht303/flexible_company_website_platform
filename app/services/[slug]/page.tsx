import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { ServiceReviewForm } from "@/components/public/ServiceReviewForm";
import { prisma } from "@/lib/db";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await isPublicPageVisible("services"))) notFound();

  const { services } = await getPublicSiteContext();
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();
  const galleryIds = "gallery" in service ? getGalleryIds(service.gallery) : [];
  const reviews = "id" in service ? await getServiceReviews(service.id) : [];
  const averageRating = getAverageRating(reviews);

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
            <p>{service.description}</p>
          </div>
        </div>
      </section>
      <section className="section alt">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Customer Reviews</h2>
              <p>
                {reviews.length
                  ? `${averageRating.toFixed(1)} out of 5 from ${reviews.length} review${reviews.length === 1 ? "" : "s"}.`
                  : "Be the first customer to share your experience with this service."}
              </p>
            </div>
          </div>
          <div className="reviews-layout">
            <div className="reviews-list">
              {reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div>
                    <strong>{review.name}</strong>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="stars" aria-label={`${review.rating} out of 5 stars`}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                  <p>{review.comment}</p>
                </article>
              ))}
              {reviews.length === 0 ? (
                <div className="card">
                  <p>No reviews yet.</p>
                </div>
              ) : null}
            </div>
            <ServiceReviewForm serviceSlug={service.slug} />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function getGalleryIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function getServiceReviews(serviceId: string) {
  try {
    return await prisma.serviceReview.findMany({
      where: {
        serviceId,
        isVisible: true
      },
      select: {
        id: true,
        name: true,
        rating: true,
        comment: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });
  } catch {
    return [];
  }
}

function getAverageRating(reviews: Array<{ rating: number }>) {
  if (!reviews.length) return 0;
  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
