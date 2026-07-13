import { z } from "zod";
import { isSafeCssColor } from "./css-color";
import { isSafePublicUrl } from "./safe-url";

const customCssSchema = z
  .string()
  .max(5000)
  .refine(
    (value) => !/(<|<\/style|@import|javascript:|expression\s*\()/i.test(value),
    "Custom CSS contains unsafe content."
  );

export const contactInquirySchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  email: z.string().email("Email is invalid").max(180),
  phone: z.string().max(60).optional().or(z.literal("")),
  companyName: z.string().max(160).optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
  sourceType: z.string().default("contact"),
  sourceId: z.string().optional()
});

export const serviceReviewSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  email: z.string().email("Email is invalid").max(180),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters").max(2000)
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(10)
});

export const siteSettingsSchema = z.object({
  siteName: z.string().min(2).max(120),
  tagline: z.string().max(180).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(80).optional().nullable(),
  address: z.string().max(240).optional().nullable(),
  domain: z.string().max(180).optional().nullable(),
  mapEmbedUrl: z.string().url().refine(isSafePublicUrl, "URL must use http or https.").optional().nullable().or(z.literal(""))
});

export const themeSettingsSchema = z.object({
  primaryColor: z.string().refine((value) => isSafeCssColor(value, { allowInherited: false }), "Enter a valid CSS color."),
  secondaryColor: z.string().refine((value) => isSafeCssColor(value, { allowInherited: false }), "Enter a valid CSS color."),
  accentColor: z.string().refine((value) => isSafeCssColor(value, { allowInherited: false }), "Enter a valid CSS color."),
  backgroundColor: z.string().refine((value) => isSafeCssColor(value, { allowInherited: false }), "Enter a valid CSS color."),
  textColor: z.string().refine((value) => isSafeCssColor(value, { allowInherited: false }), "Enter a valid CSS color."),
  fontFamily: z.string().min(2).max(80),
  borderRadius: z.enum(["none", "small", "medium", "large"]),
  headerLayout: z.string().min(2).max(60),
  footerLayout: z.string().min(2).max(60),
  customCss: customCssSchema.optional().nullable()
});
