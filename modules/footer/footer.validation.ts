import { z } from "zod";
import { isSafePublicUrl } from "@/lib/safe-url";

export const footerPartnerSchema = z.object({
  name: z.string().min(2).max(180),
  websiteUrl: z.string().url().refine(isSafePublicUrl, "URL must use http or https.").optional().nullable().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isVisible: z.coerce.boolean().default(true)
});
