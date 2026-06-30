import "server-only";

import { prisma } from "@/lib/db";

export type PublicFooterPartner = {
  id: string;
  name: string;
  logoId: string;
  websiteUrl: string | null;
};

export async function getVisibleFooterPartners(): Promise<PublicFooterPartner[]> {
  try {
    return await prisma.footerPartner.findMany({
      where: {
        isVisible: true
      },
      select: {
        id: true,
        name: true,
        logoId: true,
        websiteUrl: true
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });
  } catch {
    return [];
  }
}
