import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { VisualPageRenderer } from "@/components/shared/VisualPageRenderer";
import { prisma } from "@/lib/db";
import { getCurrentLanguage } from "@/lib/i18n/server";
import { isPublicPageVisible } from "@/lib/page-visibility";
import { filterBuilderBlocksForPage } from "@/modules/page-builder/page-builder.policy";
import type { BuilderBlock } from "@/modules/page-builder/page-builder.types";
import { hasBuilderSections, sectionsToBuilderBlocks } from "@/modules/page-builder/page-builder.utils";

export default async function AboutPage() {
  if (!(await isPublicPageVisible("about"))) notFound();

  const [language, aboutPage] = await Promise.all([
    getCurrentLanguage(),
    prisma.page.findUnique({
      where: { slug: "about" },
      include: {
        sections: {
          where: { enabled: true },
          orderBy: { sortOrder: "asc" }
        }
      }
    })
  ]);
  const builderBlocks =
    aboutPage?.template === "visual-builder" && aboutPage.status === "PUBLISHED" && hasBuilderSections(aboutPage.sections)
      ? filterBuilderBlocksForPage("about", sectionsToBuilderBlocks(aboutPage.sections).filter(isCanvasBlock))
      : [];

  return (
    <PublicShell pageSlug="about">
      <VisualPageRenderer blocks={builderBlocks} language={language} />
    </PublicShell>
  );
}

function isCanvasBlock(block: BuilderBlock) {
  return typeof block.canvasX === "number" && typeof block.canvasY === "number" && typeof block.canvasWidth === "number";
}
