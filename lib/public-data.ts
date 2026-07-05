import type { CSSProperties } from "react";
import { PublishStatus } from "@prisma/client";
import { defaultHomeSections, defaultSite } from "@/config/default-site";
import { defaultTheme, radiusMap } from "@/config/default-theme";
import { prisma } from "@/lib/db";
import { toPublicForm } from "@/modules/forms/forms.service";

export type PublicSiteContext = Awaited<ReturnType<typeof getPublicSiteContext>>;

const publicDataWarningLabels = new Set<string>();

export async function getPublicSiteContext() {
  const [site, theme, homePage, services, products, posts, team, forms, qaItems] = await Promise.all([
    safelyLoadPublicData("site settings", () => prisma.siteSetting.findFirst(), null),
    getThemeSetting(),
    safelyLoadPublicData(
      "home page sections",
      () =>
        prisma.page.findUnique({
          where: { slug: "home" },
          include: { sections: { orderBy: { sortOrder: "asc" } } }
        }),
      null
    ),
    safelyLoadPublicData(
      "services",
      () =>
        prisma.service.findMany({
          where: { status: PublishStatus.PUBLISHED },
          orderBy: { createdAt: "desc" },
          take: 12
        }),
      []
    ),
    safelyLoadPublicData(
      "products",
      () =>
        prisma.product.findMany({
          where: { status: PublishStatus.PUBLISHED },
          orderBy: { createdAt: "desc" },
          take: 12
        }),
      []
    ),
    safelyLoadPublicData(
      "posts",
      () =>
        prisma.post.findMany({
          where: { status: PublishStatus.PUBLISHED },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 12
        }),
      []
    ),
    safelyLoadPublicData(
      "team",
      () =>
        prisma.teamMember.findMany({
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" }
        }),
      []
    ),
    safelyLoadPublicData(
      "forms",
      () =>
        prisma.form.findMany({
          where: { status: PublishStatus.PUBLISHED },
          include: { fields: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
          orderBy: { name: "asc" },
          take: 50
        }),
      []
    ),
    safelyLoadPublicData(
      "Q&A",
      () =>
        prisma.qaItem.findMany({
          where: { status: "PUBLISHED" },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 50
        }),
      []
    )
  ]);

  return {
    site: { ...defaultSite, ...site },
    theme: { ...defaultTheme, ...theme },
    sections: homePage?.sections?.length ? homePage.sections : defaultHomeSections,
    services,
    products,
    posts,
    team,
    forms: forms.map(toPublicForm),
    qaItems
  };
}

async function getThemeSetting() {
  const themeRows = await safelyLoadPublicData(
    "theme settings",
    () =>
      prisma.$queryRaw<Array<Record<string, string | null>>>`
        SELECT
          "primaryColor",
          "secondaryColor",
          "accentColor",
          "backgroundColor",
          "textColor",
          "fontFamily",
          "borderRadius",
          "headerLayout",
          "footerLayout",
          "customCss"
        FROM "ThemeSetting"
        ORDER BY "createdAt" ASC
        LIMIT 1
      `,
    []
  );

  const theme = themeRows[0] ?? null;
  if (!theme) return null;

  const backgroundRows = await safelyLoadPublicData(
    "theme background image",
    () =>
      prisma.$queryRaw<Array<{ backgroundImageId: string | null }>>`
        SELECT "backgroundImageId"
        FROM "ThemeSetting"
        ORDER BY "createdAt" ASC
        LIMIT 1
      `,
    []
  );

  return {
    ...theme,
    backgroundImageId: backgroundRows[0]?.backgroundImageId ?? null
  };
}

async function safelyLoadPublicData<T>(label: string, loader: () => Promise<T>, fallback: T) {
  try {
    return await loader();
  } catch (error) {
    if (!publicDataWarningLabels.has(label)) {
      publicDataWarningLabels.add(label);
      console.warn(`Public ${label} could not be loaded; using defaults.`, error);
    }
    return fallback;
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
    "--radius-button": radius,
    "--theme-background-image": theme.backgroundImageId ? `url("/api/media/${theme.backgroundImageId}")` : "none",
    "--theme-background-overlay": theme.backgroundImageId ? "rgb(255 255 255 / 0.18)" : "transparent",
    ...(theme.backgroundImageId
      ? {
          backgroundColor: theme.backgroundColor,
          backgroundImage: `linear-gradient(rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.18)), url("/api/media/${theme.backgroundImageId}")`,
          backgroundAttachment: "fixed",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover"
        }
      : {})
  } as CSSProperties;
}

export async function getPublicItem(kind: "service" | "product" | "post", slug: string) {
  const data = await getPublicSiteContext();
  const collection =
    kind === "service" ? data.services : kind === "product" ? data.products : data.posts;

  return collection.find((item) => item.slug === slug) ?? null;
}
