import { PublicShell } from "@/components/public/PublicShell";
import { VisualPageRenderer } from "@/components/shared/VisualPageRenderer";
import { getPublicSiteContext } from "@/lib/public-data";
import type { BuilderBlock } from "@/modules/page-builder/page-builder.types";
import { sectionsToBuilderBlocks } from "@/modules/page-builder/page-builder.utils";

export default async function HomePage() {
  const { sections, team, services, posts } = await getPublicSiteContext();
  const builderBlocks = sectionsToBuilderBlocks(sections).filter(isCanvasBlock);

  return (
    <PublicShell pageSlug="home">
      <VisualPageRenderer
        blocks={builderBlocks}
        dynamicContent={{
          team,
          services,
          posts
        }}
      />
    </PublicShell>
  );
}

function isCanvasBlock(block: BuilderBlock) {
  return typeof block.canvasX === "number" && typeof block.canvasY === "number" && typeof block.canvasWidth === "number";
}
