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
    canvasX: 8,
    canvasY: 40,
    canvasWidth: 84,
    canvasHeight: 260,
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
        minHeight: 520,
        borderRadius: 16,
        shadow: "soft"
      };
    case "text":
      return {
        ...base,
        title: "Section heading",
        text: "Add paragraph content here.",
        fontSize: 18,
        borderRadius: 0,
        shadow: "none"
      };
    case "image":
      return {
        ...base,
        title: "Image block",
        imageAlt: "Page image",
        align: "center",
        width: "wide",
        minHeight: 320,
        borderRadius: 12,
        shadow: "medium",
        hoverEffect: true
      };
    case "button":
      return {
        ...base,
        buttonText: "Learn more",
        buttonUrl: "/about",
        align: "center",
        background: "#2563eb",
        color: "#ffffff",
        borderRadius: 999,
        shadow: "medium",
        hoverEffect: true
      };
    case "banner":
      return {
        ...base,
        title: "Announcement",
        text: "Share a company update, offer, or important message.",
        background: "#eef2ff",
        align: "center",
        borderRadius: 14,
        shadow: "soft"
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
        width: "wide",
        borderRadius: 10,
        hoverEffect: true
      };
    case "twoColumn":
      return {
        ...base,
        leftTitle: "Left column",
        leftText: "Use this side for context.",
        rightTitle: "Right column",
        rightText: "Use this side for supporting detail.",
        width: "wide",
        borderRadius: 10
      };
    case "divider":
      return {
        ...base,
        paddingY: 20,
        borderColor: "#d8dee9"
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
        background: "#f8fafc",
        borderRadius: 14,
        shadow: "soft"
      };
    case "team":
      return {
        ...base,
        title: "Team",
        width: "full",
        canvasHeight: 320,
        scrollMode: "infinite",
        scrollDirection: "horizontal",
        showCarouselArrows: false,
        autoScroll: true,
        autoScrollSpeed: 40,
        titleLinkEnabled: true,
        titleLinkUrl: "/team"
      };
    case "services":
      return {
        ...base,
        title: "Services",
        width: "full",
        canvasHeight: 320,
        scrollMode: "infinite",
        scrollDirection: "horizontal",
        showCarouselArrows: false,
        autoScroll: true,
        autoScrollSpeed: 40,
        titleLinkEnabled: true,
        titleLinkUrl: "/services"
      };
    case "blog":
      return {
        ...base,
        title: "Blog",
        width: "full",
        canvasHeight: 300,
        scrollMode: "infinite",
        scrollDirection: "horizontal",
        showCarouselArrows: false,
        autoScroll: true,
        autoScrollSpeed: 40,
        titleLinkEnabled: true,
        titleLinkUrl: "/blog"
      };
    case "form":
      return {
        ...base,
        title: "Contact form",
        text: "Choose a published form in the inspector.",
        width: "normal",
        canvasHeight: 520,
        formLayout: "stacked",
        submitButtonText: "Submit",
        formDescriptionOverride: "",
        sourceType: "page-builder",
        borderRadius: 10,
        shadow: "soft"
      };
    case "qa":
      return {
        ...base,
        title: "Questions & Answers",
        width: "wide",
        canvasHeight: 340,
        qaLimit: 6,
        qaLayout: "cards",
        showAskQuestionButton: true,
        titleLinkEnabled: true,
        titleLinkUrl: "/qa",
        borderRadius: 10,
        shadow: "none"
      };
  }
}

export const defaultBuilderBlocks: BuilderBlock[] = [
];

function createBlockId() {
  return globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
