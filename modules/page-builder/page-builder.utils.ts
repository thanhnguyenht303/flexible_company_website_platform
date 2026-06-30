import type { BuilderBlock } from "@/modules/page-builder/page-builder.types";
import { defaultBuilderBlocks } from "@/modules/page-builder/page-builder.defaults";

type BuilderSectionInput = {
  id?: string;
  type: string;
  enabled: boolean;
  settings: unknown;
};

export function sectionsToBuilderBlocks(sections: BuilderSectionInput[]) {
  const builderSections = sections.filter((section) => section.type.startsWith("builder_"));
  if (!builderSections.length) return defaultBuilderBlocks;

  return builderSections.map((section, index) => {
    const settings = section.settings && typeof section.settings === "object" ? section.settings : {};
    return {
      id: section.id ?? `section-${index}`,
      enabled: section.enabled,
      ...(settings as object),
      type: section.type.replace("builder_", "")
    } as BuilderBlock;
  });
}

export function hasBuilderSections(sections: Array<{ type: string }>) {
  return sections.some((section) => section.type.startsWith("builder_"));
}
