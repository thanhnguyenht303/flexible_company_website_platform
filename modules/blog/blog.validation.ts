import { z } from "zod";
import { slugify } from "@/lib/slug";
import {
  articleDocumentToText,
  normalizeArticleDocument,
  type ArticleDocument
} from "@/modules/blog/article-document";

const nullableShortText = (length: number) => z.string().max(length).optional().nullable();

export const blogDraftSchema = z.object({
  title: z.string().max(180).default(""),
  titleVi: nullableShortText(180),
  slug: z.string().max(220).optional(),
  excerpt: nullableShortText(320),
  excerptVi: nullableShortText(320),
  content: z.string().max(500_000).optional().default(""),
  contentVi: z.string().max(500_000).optional().nullable(),
  contentJson: z.unknown().optional().nullable(),
  contentJsonVi: z.unknown().optional().nullable(),
  tagNames: z.array(z.string().trim().min(1).max(50)).max(5).optional().default([]),
  featuredImageAlt: nullableShortText(300),
  seoTitle: nullableShortText(180),
  seoDescription: nullableShortText(320),
  canonicalUrl: z.union([z.literal(""), z.string().url().max(2048)]).optional().nullable(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "UNLISTED", "ARCHIVED"]).optional(),
  scheduledAt: z.union([z.literal(""), z.string().datetime()]).optional().nullable(),
  revisionNumber: z.number().int().nonnegative().optional(),
  createRevision: z.boolean().optional()
});

export const blogPostSchema = blogDraftSchema.extend({
  title: z.string().trim().min(2).max(180),
  content: z.string().min(20).max(500_000),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "UNLISTED", "ARCHIVED"]).default("DRAFT")
});

export function normalizeBlogPostInput(input: z.infer<typeof blogDraftSchema>) {
  return {
    ...input,
    title: input.title.trim(),
    slug: input.slug?.trim() ? slugify(input.slug) : input.title.trim() ? slugify(input.title) : "untitled-story",
    tagNames: Array.from(new Set(input.tagNames.map((tag) => tag.trim()).filter(Boolean))).slice(0, 5),
    contentJson: normalizeOptionalDocument(input.contentJson),
    contentJsonVi: normalizeOptionalDocument(input.contentJsonVi)
  };
}

export function validatePublishablePost(input: {
  title: string;
  content: string;
  contentJson?: ArticleDocument | null;
  featuredImageId?: string | null;
  featuredImageAlt?: string | null;
  status: string;
  scheduledAt?: string | Date | null;
}) {
  const errors: Record<string, string> = {};
  const contentText = articleDocumentToText(input.contentJson) || input.content;

  if (input.title.trim().length < 2) errors.title = "Add a title before publishing.";
  if (contentText.trim().length < 20) errors.contentJson = "Write at least 20 characters before publishing.";
  if (input.featuredImageId && !input.featuredImageAlt?.trim()) {
    errors.featuredImageAlt = "Add alt text for the featured image before publishing.";
  }
  if (input.status === "SCHEDULED") {
    const scheduledDate = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
      errors.scheduledAt = "Choose a valid publication date and time.";
    } else if (scheduledDate.getTime() <= Date.now()) {
      errors.scheduledAt = "The scheduled publication time must be in the future.";
    }
  }

  return errors;
}

function normalizeOptionalDocument(value: unknown) {
  if (value === undefined || value === null) return null;
  return normalizeArticleDocument(value);
}
