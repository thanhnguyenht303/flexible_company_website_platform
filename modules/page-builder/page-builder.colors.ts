import type { BuilderBlock } from "./page-builder.types";

export function getBuilderBlockPaintColors(
  block: Pick<BuilderBlock, "type" | "background" | "color" | "borderColor">,
  defaultBorderColor: string
) {
  return {
    backgroundColor: block.type === "button" ? "transparent" : block.background || "transparent",
    textColor: block.color || "inherit",
    borderColor: block.borderColor || defaultBorderColor
  };
}
