import { z } from "zod";
import { slugify } from "@/lib/slug";

export const blogPostSchema = z.object({
  title: z.string().min(2).max(180),
  slug: z.string().optional(),
  excerpt: z.string().max(320).optional().nullable(),
  content: z.string().min(20),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});

export function normalizeBlogPostInput(input: z.infer<typeof blogPostSchema>) {
  return {
    ...input,
    slug: input.slug ? slugify(input.slug) : slugify(input.title)
  };
}
