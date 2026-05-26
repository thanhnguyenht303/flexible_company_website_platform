import { z } from "zod";
import { slugify } from "@/lib/slug";

export const productSchema = z.object({
  name: z.string().min(2).max(180),
  slug: z.string().optional(),
  summary: z.string().max(320).optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});

export function normalizeProductInput(input: z.infer<typeof productSchema>) {
  return {
    ...input,
    slug: input.slug ? slugify(input.slug) : slugify(input.name)
  };
}
