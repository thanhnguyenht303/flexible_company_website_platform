export const defaultSite = {
  siteName: "Demo Company",
  tagline: "Flexible websites for growing companies",
  description:
    "A reusable company website CMS with editable branding, content, inquiries, media, and SEO.",
  email: "hello@example-company.com",
  phone: "+1 (555) 010-2026",
  address: "100 Market Street, Suite 300",
  socialLinks: {
    linkedin: "https://www.linkedin.com",
    facebook: "https://www.facebook.com"
  },
  defaultSeo: {
    title: "Demo Company",
    description: "A flexible website platform for company websites."
  }
};

export const defaultHomeSections = [
  {
    type: "hero",
    enabled: true,
    sortOrder: 1,
    settings: {
      headline: "Welcome to Demo Company",
      subtitle: "Introduce your company, products, and services with a flexible website.",
      ctaText: "Contact Us",
      ctaUrl: "/contact",
      alignment: "left"
    }
  },
  {
    type: "service_grid",
    enabled: true,
    sortOrder: 2,
    settings: { title: "Our Services", mode: "latest", limit: 3, layout: "cards" }
  },
  {
    type: "product_grid",
    enabled: true,
    sortOrder: 3,
    settings: { title: "Our Products", mode: "latest", limit: 3, layout: "cards" }
  },
  {
    type: "blog_grid",
    enabled: true,
    sortOrder: 4,
    settings: { title: "Latest News", mode: "latest", limit: 3 }
  },
  {
    type: "contact_cta",
    enabled: true,
    sortOrder: 5,
    settings: {
      title: "Ready to work with us?",
      subtitle: "Send us a message and our team will respond soon.",
      buttonText: "Get in Touch",
      buttonUrl: "/contact"
    }
  }
];

export const defaultServices = [
  {
    name: "Website Strategy",
    slug: "website-strategy",
    summary: "Plan company pages, content structure, SEO, and lead paths.",
    description:
      "A practical service package for shaping public pages, calls to action, and content modules before launch."
  },
  {
    name: "Implementation",
    slug: "implementation",
    summary: "Build responsive public pages and admin-managed modules.",
    description:
      "A delivery workflow for creating reusable modules, editorial controls, and production-ready pages."
  },
  {
    name: "Maintenance",
    slug: "maintenance",
    summary: "Keep content, dependencies, security patches, and backups healthy.",
    description:
      "A lightweight maintenance plan for long-running company websites."
  }
];

export const defaultProducts = [
  {
    name: "CMS Starter",
    slug: "cms-starter",
    summary: "Launch a branded company website with editable homepage sections.",
    description:
      "The default product bundle includes public pages, admin settings, uploads, and inquiry management."
  },
  {
    name: "Content Module Pack",
    slug: "content-module-pack",
    summary: "Products, services, blog posts, and team profiles in one platform.",
    description:
      "A reusable content package that can be extended with new business modules over time."
  },
  {
    name: "Deployment Kit",
    slug: "deployment-kit",
    summary: "Docker Compose, Nginx, PostgreSQL, and backup scripts.",
    description:
      "Production-oriented deployment pieces for running the platform on a server with a domain."
  }
];

export const defaultPosts = [
  {
    title: "How flexible content sections speed up company launches",
    slug: "flexible-content-sections",
    excerpt: "Use reusable homepage sections to launch quickly and refine without code changes.",
    content:
      "Flexible content sections let teams ship a complete website, then adjust layout and messaging from the admin dashboard as the business changes."
  },
  {
    title: "What belongs in a safe first website CMS",
    slug: "safe-first-website-cms",
    excerpt: "Authentication, permissions, validation, upload limits, backups, and audit logs belong in MVP.",
    content:
      "A company website CMS should start with careful defaults: secure sessions, server-side validation, restricted uploads, role checks, and clear operational documentation."
  }
];

export const defaultTeam = [
  {
    name: "Alex Morgan",
    position: "Managing Director",
    bio: "Keeps strategy, customer outcomes, and launch priorities aligned."
  },
  {
    name: "Sam Rivera",
    position: "Operations Lead",
    bio: "Owns process, service delivery, and day-to-day company coordination."
  },
  {
    name: "Taylor Kim",
    position: "Customer Success",
    bio: "Helps customers get fast answers and clear next steps."
  }
];
