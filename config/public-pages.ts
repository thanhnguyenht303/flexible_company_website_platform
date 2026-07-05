export const publicPages = [
  { slug: "about", title: "About", href: "/about", showInHeader: true },
  { slug: "services", title: "Services", href: "/services", showInHeader: true },
  { slug: "products", title: "Products", href: "/products", showInHeader: true },
  { slug: "team", title: "Team", href: "/team", showInHeader: true },
  { slug: "careers", title: "Careers", href: "/careers", showInHeader: true },
  { slug: "blog", title: "Blog", href: "/blog", showInHeader: true },
  { slug: "qa", title: "Q&A", href: "/qa", showInHeader: true },
  { slug: "contact", title: "Contact", href: "/contact", showInHeader: true },
  { slug: "privacy", title: "Privacy", href: "/privacy", showInHeader: false }
] as const;

export type PublicPageSlug = (typeof publicPages)[number]["slug"];

export function getPublicPage(slug: string) {
  return publicPages.find((page) => page.slug === slug) ?? null;
}
