import { PublicShell } from "@/components/public/PublicShell";
import { HomeSectionsRenderer } from "@/components/shared/HomeSectionsRenderer";
import { VisualPageRenderer } from "@/components/shared/VisualPageRenderer";
import { getVisiblePageSlugs } from "@/lib/page-visibility";
import { getPublicSiteContext } from "@/lib/public-data";
import { hasBuilderSections, sectionsToBuilderBlocks } from "@/modules/page-builder/page-builder.utils";

export default async function HomePage() {
  const [{ site, services, products, posts, sections }, visiblePages] = await Promise.all([
    getPublicSiteContext(),
    getVisiblePageSlugs()
  ]);
  const builderBlocks = sectionsToBuilderBlocks(sections);
  const useBuilder = hasBuilderSections(sections);

  if (useBuilder) {
    return (
      <PublicShell pageSlug="home">
        <VisualPageRenderer blocks={builderBlocks} />
      </PublicShell>
    );
  }

  return (
    <PublicShell pageSlug="home">
      <HomeSectionsRenderer
        sections={sections}
        site={site}
        services={services}
        products={products}
        posts={posts}
        visiblePages={visiblePages}
      />
    </PublicShell>
  );
}
