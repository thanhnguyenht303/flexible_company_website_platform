import "server-only";

import { PublishStatus } from "@prisma/client";
import { publicPages, type PublicPageSlug } from "@/config/public-pages";
import { prisma } from "@/lib/db";

export type PublicPageVisibility = {
  slug: PublicPageSlug;
  title: string;
  href: string;
  showInHeader: boolean;
  status: PublishStatus;
  visible: boolean;
};

export async function getPublicPageVisibility(): Promise<PublicPageVisibility[]> {
  try {
    const pages = await prisma.page.findMany({
      where: {
        slug: {
          in: publicPages.map((page) => page.slug)
        }
      },
      select: {
        slug: true,
        status: true
      }
    });
    const statuses = new Map(pages.map((page) => [page.slug, page.status]));

    return publicPages.map((page) => {
      const status = statuses.get(page.slug) ?? PublishStatus.PUBLISHED;

      return {
        ...page,
        status,
        visible: status === PublishStatus.PUBLISHED
      };
    });
  } catch {
    return publicPages.map((page) => ({
      ...page,
      status: PublishStatus.PUBLISHED,
      visible: true
    }));
  }
}

export async function isPublicPageVisible(slug: PublicPageSlug) {
  const pages = await getPublicPageVisibility();
  return pages.find((page) => page.slug === slug)?.visible ?? true;
}

export async function getVisibleHeaderPages() {
  const pages = await getPublicPageVisibility();
  return pages
    .filter((page) => page.visible && page.showInHeader)
    .map(({ title, href }) => ({ title, href }));
}

export async function getVisiblePageSlugs() {
  const pages = await getPublicPageVisibility();
  return new Set(pages.filter((page) => page.visible).map((page) => page.slug));
}
