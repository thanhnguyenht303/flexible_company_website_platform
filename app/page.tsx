import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { HeroBuilderVisual } from "@/components/public/HeroBuilderVisual";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function HomePage() {
  const { site, services, products, posts } = await getPublicSiteContext();

  return (
    <PublicShell>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <h1>{site.siteName}</h1>
            <p>{site.description ?? site.tagline}</p>
            <div className="hero__actions">
              <Link className="button" href="/contact">
                Contact Us <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" href="/services">
                View Services
              </Link>
            </div>
          </div>
          <HeroBuilderVisual />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Services</h2>
              <p>Published service records appear here and can be managed from the admin dashboard.</p>
            </div>
            <Link className="button secondary" href="/services">
              All Services
            </Link>
          </div>
          <div className="grid">
            {services.slice(0, 3).map((service) => (
              <Link className="card" href={`/services/${service.slug}`} key={service.slug}>
                <h3>{service.name}</h3>
                <p>{service.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Products</h2>
              <p>Use the products module for catalogs, brochures, technical specs, and lead capture.</p>
            </div>
            <Link className="button secondary" href="/products">
              All Products
            </Link>
          </div>
          <div className="grid">
            {products.slice(0, 3).map((product) => (
              <Link className="card" href={`/products/${product.slug}`} key={product.slug}>
                <h3>{product.name}</h3>
                <p>{product.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stat-grid">
            {["Theme variables", "Role permissions", "Upload rules", "Audit logs"].map((label) => (
              <div className="stat" key={label}>
                <CheckCircle2 color="var(--color-primary)" />
                <strong>Ready</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Latest News</h2>
              <p>Published posts use the same SEO and visibility rules as products and services.</p>
            </div>
            <Link className="button secondary" href="/blog">
              All Posts
            </Link>
          </div>
          <div className="grid">
            {posts.slice(0, 3).map((post) => (
              <Link className="card" href={`/blog/${post.slug}`} key={post.slug}>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
