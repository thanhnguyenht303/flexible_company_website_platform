import type { CSSProperties } from "react";
import { PublishStatus } from "@prisma/client";
import {
  defaultHomeSections,
  defaultPosts,
  defaultProducts,
  defaultServices,
  defaultSite,
  defaultTeam
} from "@/config/default-site";
import { defaultTheme, radiusMap } from "@/config/default-theme";
import { prisma } from "@/lib/db";

export type PublicSiteContext = Awaited<ReturnType<typeof getPublicSiteContext>>;

export async function getPublicSiteContext() {
  try {
    const [site, theme, homePage, services, products, posts, team] = await Promise.all([
      prisma.siteSetting.findFirst(),
      prisma.themeSetting.findFirst(),
      prisma.page.findUnique({
        where: { slug: "home" },
        include: { sections: { orderBy: { sortOrder: "asc" } } }
      }),
      prisma.service.findMany({
        where: { status: PublishStatus.PUBLISHED },
        orderBy: { createdAt: "desc" },
        take: 12
      }),
      prisma.product.findMany({
        where: { status: PublishStatus.PUBLISHED },
        orderBy: { createdAt: "desc" },
        take: 12
      }),
      prisma.post.findMany({
        where: { status: PublishStatus.PUBLISHED },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 12
      }),
      prisma.teamMember.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" }
      })
    ]);

    return {
      site: { ...defaultSite, ...site },
      theme: { ...defaultTheme, ...theme },
      sections: homePage?.sections?.length ? homePage.sections : defaultHomeSections,
      services: services.length ? services : defaultServices,
      products: products.length ? products : defaultProducts,
      posts: posts.length ? posts : defaultPosts,
      team: team.length ? team : defaultTeam
    };
  } catch {
    return {
      site: defaultSite,
      theme: defaultTheme,
      sections: defaultHomeSections,
      services: defaultServices,
      products: defaultProducts,
      posts: defaultPosts,
      team: defaultTeam
    };
  }
}

export async function getThemeStyle(): Promise<CSSProperties> {
  const { theme } = await getPublicSiteContext();
  const radius = radiusMap[theme.borderRadius] ?? radiusMap.medium;

  return {
    "--color-primary": theme.primaryColor,
    "--color-secondary": theme.secondaryColor,
    "--color-accent": theme.accentColor,
    "--color-background": theme.backgroundColor,
    "--color-text": theme.textColor,
    "--font-family": `${theme.fontFamily}, Arial, sans-serif`,
    "--radius-card": radius,
    "--radius-button": radius
  } as CSSProperties;
}

export async function getPublicItem(kind: "service" | "product" | "post", slug: string) {
  const data = await getPublicSiteContext();
  const collection =
    kind === "service" ? data.services : kind === "product" ? data.products : data.posts;

  return collection.find((item) => item.slug === slug) ?? null;
}
