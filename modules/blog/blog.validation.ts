import { z } from "zod";
import { slugify } from "@/lib/slug";

export const blogPostSchema = z.object({
  title: z.string().min(2).max(180),
  titleVi: z.string().max(180).optional().nullable(),
  slug: z.string().optional(),
  excerpt: z.string().max(320).optional().nullable(),
  excerptVi: z.string().max(320).optional().nullable(),
  content: z.string().min(20),
  contentVi: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});

export function normalizeBlogPostInput(input: z.infer<typeof blogPostSchema>) {
  return {
    ...input,
    slug: input.slug ? slugify(input.slug) : slugify(input.title)
  };
}
