import { describe, expect, it } from "vitest";
import { getBuilderBlockPaintColors } from "../modules/page-builder/page-builder.colors";
import type { BuilderBlock } from "../modules/page-builder/page-builder.types";

describe("page-builder color rendering", () => {
  it("paints near-black saved colors directly on the rendered block", () => {
    const block: BuilderBlock = {
      id: "near-black-block",
      type: "static",
      enabled: true,
      title: "Exact colors",
      text: "The saved colors must survive the mobile cascade.",
      background: "#050505",
      color: "#fafafa",
      borderColor: "#101010"
    };

    const colors = getBuilderBlockPaintColors(block, "transparent");

    expect(colors).toEqual({
      backgroundColor: "#050505",
      textColor: "#fafafa",
      borderColor: "#101010"
    });
  });

  it("keeps a button block container transparent while painting the button color", () => {
    const block: BuilderBlock = {
      id: "button-block",
      type: "button",
      enabled: true,
      buttonText: "Continue",
      buttonUrl: "/contact",
      background: "#050505",
      buttonTextColor: "#ffffff"
    };

    const colors = getBuilderBlockPaintColors(block, "transparent");

    expect(colors.backgroundColor).toBe("transparent");
  });
});
