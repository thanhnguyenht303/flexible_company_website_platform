import { z } from "zod";
import { slugify } from "@/lib/slug";
import { isSafePublicUrl } from "@/lib/safe-url";

export const jobPostingSchema = z.object({
  title: z.string().min(2).max(180),
  slug: z.string().max(220).optional(),
  summary: z.string().max(400).optional().nullable(),
  description: z.string().min(20),
  requirements: z.string().optional().nullable(),
  department: z.string().max(120).optional().nullable(),
  location: z.string().max(160).optional().nullable(),
  employmentType: z.string().max(80).optional().nullable(),
  workMode: z.string().max(80).optional().nullable(),
  salaryRange: z.string().max(120).optional().nullable(),
  applyEmail: z.string().email().optional().nullable().or(z.literal("")),
  applyUrl: z.string().url().refine(isSafePublicUrl, "URL must use http or https.").optional().nullable().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});

export function normalizeJobPostingInput(input: z.infer<typeof jobPostingSchema>) {
  return {
    ...input,
    slug: input.slug ? slugify(input.slug) : slugify(input.title)
  };
}
