import type { BuilderBlock, BuilderBlockType } from "@/modules/page-builder/page-builder.types";

export const supportedBuilderPageSlugs = ["home", "about"] as const;

export type SupportedBuilderPageSlug = (typeof supportedBuilderPageSlugs)[number];

export const aboutBuilderBlockTypes = [
  "hero",
  "text",
  "image",
  "banner",
  "button",
  "video",
  "gallery",
  "spacer",
  "divider",
  "static"
] as const satisfies readonly BuilderBlockType[];

const pageBlockPolicies: Partial<Record<string, readonly BuilderBlockType[]>> = {
  about: aboutBuilderBlockTypes
};

export function isSupportedBuilderPageSlug(slug: string): slug is SupportedBuilderPageSlug {
  return supportedBuilderPageSlugs.includes(slug as SupportedBuilderPageSlug);
}

export function getAllowedBuilderBlockTypes(slug: string) {
  return pageBlockPolicies[slug] ?? null;
}

export function isBuilderBlockAllowedForPage(slug: string, block: Pick<BuilderBlock, "type">) {
  const allowedTypes = getAllowedBuilderBlockTypes(slug);
  return !allowedTypes || allowedTypes.includes(block.type);
}

export function filterBuilderBlocksForPage(slug: string, blocks: BuilderBlock[]) {
  return blocks.filter((block) => isBuilderBlockAllowedForPage(slug, block));
}
