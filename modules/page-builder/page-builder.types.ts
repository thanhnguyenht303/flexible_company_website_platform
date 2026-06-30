export type BuilderBlockType =
  | "hero"
  | "text"
  | "image"
  | "button"
  | "banner"
  | "cards"
  | "twoColumn"
  | "divider"
  | "spacer"
  | "contactCta";

export type BuilderWidth = "narrow" | "normal" | "wide" | "full";
export type BuilderAlign = "left" | "center" | "right";

export type BuilderCard = {
  title: string;
  text: string;
  href?: string;
};

export type BuilderBlock = {
  id: string;
  type: BuilderBlockType;
  enabled: boolean;
  title?: string;
  subtitle?: string;
  text?: string;
  quote?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageId?: string;
  imageAlt?: string;
  href?: string;
  cards?: BuilderCard[];
  leftTitle?: string;
  leftText?: string;
  rightTitle?: string;
  rightText?: string;
  width?: BuilderWidth;
  align?: BuilderAlign;
  background?: string;
  color?: string;
  fontSize?: number;
  paddingY?: number;
  blockWidth?: number;
  minHeight?: number;
  height?: number;
};
