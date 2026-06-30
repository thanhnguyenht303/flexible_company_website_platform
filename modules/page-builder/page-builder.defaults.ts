import type { BuilderBlock, BuilderBlockType } from "@/modules/page-builder/page-builder.types";

export function createBuilderBlock(type: BuilderBlockType): BuilderBlock {
  const base = {
    id: createBlockId(),
    type,
    enabled: true,
    width: "normal" as const,
    align: "left" as const,
    paddingY: 56,
    blockWidth: 100,
    minHeight: 0
  };

  switch (type) {
    case "hero":
      return {
        ...base,
        title: "Welcome to your company",
        subtitle: "Create a flexible homepage with visual blocks.",
        buttonText: "Contact us",
        buttonUrl: "/contact",
        align: "center",
        width: "wide",
        paddingY: 96,
        minHeight: 520
      };
    case "text":
      return {
        ...base,
        title: "Section heading",
        text: "Add paragraph content here.",
        fontSize: 18
      };
    case "image":
      return {
        ...base,
        title: "Image block",
        imageAlt: "Page image",
        align: "center",
        width: "wide",
        minHeight: 320
      };
    case "button":
      return {
        ...base,
        buttonText: "Learn more",
        buttonUrl: "/about",
        align: "center"
      };
    case "banner":
      return {
        ...base,
        title: "Announcement",
        text: "Share a company update, offer, or important message.",
        background: "#eef2ff",
        align: "center"
      };
    case "cards":
      return {
        ...base,
        title: "Highlights",
        cards: [
          { title: "Fast updates", text: "Change content without developer support." },
          { title: "Flexible layout", text: "Arrange sections for your audience." },
          { title: "Reusable blocks", text: "Build pages from consistent components." }
        ],
        width: "wide"
      };
    case "twoColumn":
      return {
        ...base,
        leftTitle: "Left column",
        leftText: "Use this side for context.",
        rightTitle: "Right column",
        rightText: "Use this side for supporting detail.",
        width: "wide"
      };
    case "divider":
      return {
        ...base,
        paddingY: 20
      };
    case "spacer":
      return {
        ...base,
        height: 48,
        paddingY: 0
      };
    case "contactCta":
      return {
        ...base,
        title: "Ready to work with us?",
        text: "Send us a message and our team will respond soon.",
        buttonText: "Contact us",
        buttonUrl: "/contact",
        align: "center",
        background: "#f8fafc"
      };
  }
}

export const defaultBuilderBlocks: BuilderBlock[] = [
  {
    ...createBuilderBlock("hero"),
    id: "default-hero",
    title: "Welcome to Demo Company",
    subtitle: "Introduce your company, products, and services with a flexible website."
  },
  { ...createBuilderBlock("cards"), id: "default-cards" },
  { ...createBuilderBlock("contactCta"), id: "default-contact" }
];

function createBlockId() {
  return globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
