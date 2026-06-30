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

const blockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["hero", "text", "image", "button", "banner", "cards", "twoColumn", "divider", "spacer", "contactCta"]),
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
  background: colorValueSchema.optional(),
  color: colorValueSchema.optional(),
  fontSize: z.coerce.number().min(12).max(64).optional(),
  paddingY: z.coerce.number().min(0).max(180).optional(),
  blockWidth: z.coerce.number().min(25).max(100).optional(),
  minHeight: z.coerce.number().min(0).max(1000).optional(),
  height: z.coerce.number().min(0).max(240).optional()
});

export const pageBuilderSaveSchema = z.object({
  title: z.string().min(2).max(120),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  blocks: z.array(blockSchema).max(80)
});
