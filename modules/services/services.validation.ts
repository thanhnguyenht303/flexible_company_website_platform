import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(2).max(180),
  slug: z.string().min(2).max(220),
  summary: z.string().max(320).optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});
