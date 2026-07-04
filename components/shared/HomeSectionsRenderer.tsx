import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { HeroBuilderVisual } from "@/components/public/HeroBuilderVisual";
import { defaultLanguage, translate, type Language } from "@/lib/i18n/translations";

type HomeSectionsRendererProps = {
  sections: Array<{
    type: string;
    enabled: boolean;
    settings: unknown;
  }>;
  site: {
    siteName: string;
    tagline?: string | null;
    description?: string | null;
  };
  services: Array<{
    name: string;
    slug: string;
    summary?: string | null;
    imageId?: string | null;
  }>;
  products: Array<{
    name: string;
    slug: string;
    summary?: string | null;
    imageId?: string | null;
  }>;
  posts: Array<{
    title: string;
    slug: string;
    excerpt?: string | null;
    featuredImageId?: string | null;
  }>;
  visiblePages: Set<string>;
  language?: Language;
};

export function HomeSectionsRenderer({ sections, site, services, products, posts, visiblePages, language = defaultLanguage }: HomeSectionsRendererProps) {
  return (
    <>
      {sections
        .filter((section) => section.enabled)
        .map((section, index) => (
          <HomeSection
            key={`${section.type}-${index}`}
            section={section}
            site={site}
            services={services}
            products={products}
            posts={posts}
            visiblePages={visiblePages}
            language={language}
          />
        ))}
    </>
  );
}

function HomeSection({
  section,
  site,
  services,
  products,
  posts,
  visiblePages,
  language = defaultLanguage
}: Omit<HomeSectionsRendererProps, "sections"> & { section: HomeSectionsRendererProps["sections"][number] }) {
  const settings = normalizeSettings(section.settings);

  switch (section.type) {
    case "hero":
      return (
        <section className="hero">
          <div className="container hero__grid">
            <div>
              <h1>{stringValue(settings.headline) || site.siteName}</h1>
              <p>{stringValue(settings.subtitle) || site.description || site.tagline}</p>
              <div className="hero__actions">
                {stringValue(settings.ctaText) && stringValue(settings.ctaUrl) ? (
                  <Link className="button" href={stringValue(settings.ctaUrl)}>
                    {stringValue(settings.ctaText)} <ArrowRight size={18} />
                  </Link>
                ) : null}
                {visiblePages.has("services") ? (
                  <Link className="button secondary" href="/services">
                    {translate(language, "builder.defaults.allServices")}
                  </Link>
                ) : null}
              </div>
            </div>
            <HeroBuilderVisual language={language} />
          </div>
        </section>
      );
    case "service_grid":
      if (!visiblePages.has("services")) return null;
      return (
        <section className="section">
          <div className="container">
            <SectionHeader title={stringValue(settings.title) || translate(language, "builder.defaults.servicesTitle")} text={translate(language, "builder.defaults.servicesText")} href="/services" linkText={translate(language, "builder.defaults.allServices")} />
            <ContentGrid items={services.slice(0, numberValue(settings.limit, 3))} hrefPrefix="/services" />
          </div>
        </section>
      );
    case "product_grid":
      if (!visiblePages.has("products")) return null;
      return (
        <section className="section alt">
          <div className="container">
            <SectionHeader title={stringValue(settings.title) || translate(language, "builder.defaults.productsTitle")} text={translate(language, "builder.defaults.productsText")} href="/products" linkText={translate(language, "builder.defaults.allProducts")} />
            <ContentGrid items={products.slice(0, numberValue(settings.limit, 3))} hrefPrefix="/products" />
          </div>
        </section>
      );
    case "blog_grid":
      if (!visiblePages.has("blog")) return null;
      return (
        <section className="section alt">
          <div className="container">
            <SectionHeader title={stringValue(settings.title) || translate(language, "builder.defaults.blogTitle")} text={translate(language, "builder.defaults.blogText")} href="/blog" linkText={translate(language, "builder.defaults.allPosts")} />
            <ContentGrid items={posts.slice(0, numberValue(settings.limit, 3))} hrefPrefix="/blog" />
          </div>
        </section>
      );
    case "contact_cta":
      if (!visiblePages.has("contact")) return null;
      return (
        <section className="section">
          <div className="container">
            <div className="builder-banner builder-public-block--center">
              <h2>{stringValue(settings.title) || translate(language, "builder.defaults.contactTitle")}</h2>
              <p>{stringValue(settings.subtitle) || translate(language, "builder.defaults.contactText")}</p>
              <Link className="button" href={stringValue(settings.buttonUrl) || "/contact"}>
                {stringValue(settings.buttonText) || translate(language, "builder.defaults.getInTouch")}
              </Link>
            </div>
          </div>
        </section>
      );
    default:
      return (
        <section className="section">
          <div className="container">
            <div className="stat-grid">
              {[
                translate(language, "builder.defaults.statTheme"),
                translate(language, "builder.defaults.statPermissions"),
                translate(language, "builder.defaults.statUploads"),
                translate(language, "builder.defaults.statAudit")
              ].map((label) => (
                <div className="stat" key={label}>
                  <CheckCircle2 color="var(--color-primary)" />
                  <strong>{translate(language, "builder.ready")}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
  }
}

function SectionHeader({ title, text, href, linkText }: { title: string; text: string; href: string; linkText: string }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <Link className="button secondary" href={href}>
        {linkText}
      </Link>
    </div>
  );
}

function ContentGrid({
  items,
  hrefPrefix
}: {
  items: Array<{ name?: string; title?: string; slug: string; summary?: string | null; excerpt?: string | null; imageId?: string | null; featuredImageId?: string | null }>;
  hrefPrefix: string;
}) {
  return (
    <div className="grid">
      {items.map((item) => {
        const imageId = item.imageId ?? item.featuredImageId;
        return (
          <Link className="card" href={`${hrefPrefix}/${item.slug}`} key={item.slug}>
            {imageId ? (
              <div className="card-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/media/${imageId}`} alt="" />
              </div>
            ) : null}
            <h3>{item.name ?? item.title}</h3>
            <p>{item.summary ?? item.excerpt}</p>
          </Link>
        );
      })}
    </div>
  );
}

function normalizeSettings(settings: unknown) {
  return settings && typeof settings === "object" ? (settings as Record<string, unknown>) : {};
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
