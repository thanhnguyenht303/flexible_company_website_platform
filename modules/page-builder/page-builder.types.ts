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
  | "contactCta"
  | "team"
  | "services"
  | "blog";

export type BuilderWidth = "narrow" | "normal" | "wide" | "full";
export type BuilderAlign = "left" | "center" | "right";
export type BuilderDirection = "horizontal" | "vertical" | "horizontal-reverse" | "vertical-reverse";
export type BuilderVerticalAlign = "top" | "middle" | "bottom";
export type BuilderImageFit = "cover" | "contain" | "fill";
export type BuilderScrollMode = "none" | "normal" | "infinite";
export type BuilderScrollDirection = "horizontal" | "vertical";
export type BuilderShadow = "none" | "soft" | "medium" | "strong";

export type BuilderTextElementStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  align?: BuilderAlign;
  wrap?: boolean;
};

export type BuilderTextStyle = {
  title?: BuilderTextElementStyle;
  body?: BuilderTextElementStyle;
};

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
  verticalAlign?: BuilderVerticalAlign;
  contentDirection?: BuilderDirection;
  background?: string;
  color?: string;
  borderColor?: string;
  borderRadius?: number;
  shadow?: BuilderShadow;
  opacity?: number;
  hoverEffect?: boolean;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
  paragraphSpacing?: number;
  gap?: number;
  padding?: number;
  paddingY?: number;
  blockWidth?: number;
  canvasX?: number;
  canvasY?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  minHeight?: number;
  height?: number;
  imageFit?: BuilderImageFit;
  imageZoom?: number;
  imageOffsetX?: number;
  imageOffsetY?: number;
  focalX?: number;
  focalY?: number;
  stackOnMobile?: boolean;
  textStyle?: BuilderTextStyle;
  scrollMode?: BuilderScrollMode;
  scrollDirection?: BuilderScrollDirection;
  showCarouselArrows?: boolean;
  autoScroll?: boolean;
  autoScrollSpeed?: number;
  titleLinkEnabled?: boolean;
  titleLinkUrl?: string;
};
