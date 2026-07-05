import { z } from "zod";
import { isSafePublicUrl } from "@/lib/safe-url";

const publicUrlSchema = z
  .string()
  .max(500)
  .refine((value) => !value || isSafePublicUrl(value), "URL must be an http(s) URL or a relative path.");

const colorValueSchema = z
  .string()
  .max(80)
  .refine(
    (value) => !value || /^(#[0-9A-Fa-f]{3,8}|transparent|inherit|currentColor)$/.test(value),
    "Use a hex color or a safe CSS color keyword."
  );

const textElementStyleSchema = z.object({
  fontFamily: z.string().max(120).optional(),
  fontSize: z.coerce.number().min(8).max(120).optional(),
  fontWeight: z.coerce.number().min(100).max(1000).optional(),
  color: colorValueSchema.optional(),
  lineHeight: z.coerce.number().min(0.8).max(3).optional(),
  letterSpacing: z.coerce.number().min(-2).max(20).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  wrap: z.boolean().optional()
});

const blockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["hero", "text", "image", "button", "banner", "cards", "twoColumn", "divider", "spacer", "contactCta", "team", "services", "blog", "form", "qa"]),
  enabled: z.boolean().default(true),
  title: z.string().max(240).optional(),
  subtitle: z.string().max(500).optional(),
  text: z.string().max(5000).optional(),
  quote: z.string().max(1000).optional(),
  buttonText: z.string().max(120).optional(),
  buttonUrl: publicUrlSchema.optional(),
  imageId: z.string().optional(),
  imageAlt: z.string().max(180).optional(),
  href: publicUrlSchema.optional(),
  cards: z
    .array(
      z.object({
        title: z.string().max(180),
        text: z.string().max(700),
        href: publicUrlSchema.optional()
      })
    )
    .optional(),
  leftTitle: z.string().max(180).optional(),
  leftText: z.string().max(1500).optional(),
  rightTitle: z.string().max(180).optional(),
  rightText: z.string().max(1500).optional(),
  width: z.enum(["narrow", "normal", "wide", "full"]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  verticalAlign: z.enum(["top", "middle", "bottom"]).optional(),
  contentDirection: z.enum(["horizontal", "vertical", "horizontal-reverse", "vertical-reverse"]).optional(),
  background: colorValueSchema.optional(),
  color: colorValueSchema.optional(),
  borderColor: colorValueSchema.optional(),
  borderRadius: z.coerce.number().min(0).max(80).optional(),
  shadow: z.enum(["none", "soft", "medium", "strong"]).optional(),
  opacity: z.coerce.number().min(0.1).max(1).optional(),
  hoverEffect: z.boolean().optional(),
  fontSize: z.coerce.number().min(12).max(64).optional(),
  fontFamily: z.string().max(120).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  lineHeight: z.coerce.number().min(0.8).max(3).optional(),
  letterSpacing: z.coerce.number().min(-2).max(12).optional(),
  paragraphSpacing: z.coerce.number().min(0).max(80).optional(),
  gap: z.coerce.number().min(0).max(120).optional(),
  padding: z.coerce.number().min(0).max(120).optional(),
  paddingY: z.coerce.number().min(0).max(180).optional(),
  blockWidth: z.coerce.number().min(25).max(100).optional(),
  canvasX: z.coerce.number().min(0).max(100).optional(),
  canvasY: z.coerce.number().min(0).max(5000).optional(),
  canvasWidth: z.coerce.number().min(5).max(100).optional(),
  canvasHeight: z.coerce.number().min(48).max(2000).optional(),
  minHeight: z.coerce.number().min(0).max(1000).optional(),
  height: z.coerce.number().min(0).max(240).optional(),
  imageFit: z.enum(["cover", "contain", "fill"]).optional(),
  imageZoom: z.coerce.number().min(0.25).max(4).optional(),
  imageOffsetX: z.coerce.number().min(-100).max(100).optional(),
  imageOffsetY: z.coerce.number().min(-100).max(100).optional(),
  focalX: z.coerce.number().min(0).max(100).optional(),
  focalY: z.coerce.number().min(0).max(100).optional(),
  stackOnMobile: z.boolean().optional(),
  textStyle: z
    .object({
      title: textElementStyleSchema.optional(),
      body: textElementStyleSchema.optional()
    })
    .optional(),
  scrollMode: z.enum(["none", "normal", "infinite"]).optional(),
  scrollDirection: z.enum(["horizontal", "vertical"]).optional(),
  showCarouselArrows: z.boolean().optional(),
  autoScroll: z.boolean().optional(),
  autoScrollSpeed: z.coerce.number().min(0).max(240).optional(),
  titleLinkEnabled: z.boolean().optional(),
  titleLinkUrl: publicUrlSchema.optional(),
  formId: z.string().max(180).optional(),
  formSlug: z.string().max(220).optional(),
  formLayout: z.enum(["stacked", "two-column", "compact"]).optional(),
  formDescriptionOverride: z.string().max(500).optional(),
  submitButtonText: z.string().max(120).optional(),
  sourceType: z.string().max(80).optional(),
  sourceId: z.string().max(180).optional(),
  qaCategory: z.string().max(120).optional(),
  qaLimit: z.coerce.number().int().min(1).max(24).optional(),
  qaLayout: z.enum(["cards", "list", "accordion"]).optional(),
  showAskQuestionButton: z.boolean().optional()
});

export const pageBuilderSaveSchema = z.object({
  title: z.string().min(2).max(120),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  blocks: z.array(blockSchema).max(80)
});
