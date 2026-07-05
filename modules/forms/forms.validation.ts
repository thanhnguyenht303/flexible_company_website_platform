import { PublishStatus } from "@prisma/client";
import { z } from "zod";
import { isSafePublicUrl } from "@/lib/safe-url";
import { slugify } from "@/lib/slug";
import { formFieldTypes, leadPriorities, leadStatuses, qaStatuses, submissionStatuses } from "@/modules/forms/forms.types";

const optionSchema = z.object({
  label: z.string().min(1).max(160),
  value: z.string().min(1).max(160)
});

export const formFieldSchema = z.object({
  id: z.string().optional(),
  type: z.enum(formFieldTypes),
  label: z.string().min(1).max(180),
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Use letters, numbers, and underscores. Start with a letter."),
  helpText: z.string().max(500).optional().nullable(),
  placeholder: z.string().max(180).optional().nullable(),
  required: z.coerce.boolean().default(false),
  options: z.array(optionSchema).optional().nullable(),
  validation: z.record(z.unknown()).optional().nullable(),
  defaultValue: z.string().max(500).optional().nullable(),
  internalLabel: z.string().max(180).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  settings: z.record(z.unknown()).optional().nullable()
});

export const formSchema = z.object({
  name: z.string().min(2).max(180),
  slug: z.string().max(220).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.nativeEnum(PublishStatus).default(PublishStatus.DRAFT),
  successMessage: z.string().max(500).optional().nullable(),
  redirectUrl: z.string().max(500).refine((value) => !value || isSafePublicUrl(value), "Redirect URL must be relative or http(s).").optional().nullable(),
  notificationEmails: z.array(z.string().email()).max(10).default([]),
  sourceType: z.string().min(2).max(80).default("form"),
  linkedEntityType: z.string().max(80).optional().nullable(),
  linkedEntityId: z.string().max(180).optional().nullable(),
  settings: z.record(z.unknown()).optional().nullable(),
  fields: z.array(formFieldSchema).max(60).default([])
});

export const updateFormSchema = formSchema.partial().extend({
  fields: z.array(formFieldSchema).max(60).optional()
});

export const leadUpdateSchema = z.object({
  status: z.enum(leadStatuses).optional(),
  priority: z.enum(leadPriorities).optional(),
  assignedToId: z.string().optional().nullable(),
  internalNote: z.string().max(5000).optional().nullable(),
  followUpAt: z.string().datetime().optional().nullable()
});

export const submissionUpdateSchema = z.object({
  status: z.enum(submissionStatuses)
});

export const qaItemSchema = z.object({
  title: z.string().min(2).max(220),
  slug: z.string().max(240).optional(),
  question: z.string().min(10).max(10000),
  answer: z.string().max(20000).optional().nullable(),
  submitterName: z.string().max(160).optional().nullable(),
  submitterEmail: z.string().email().optional().nullable().or(z.literal("")),
  category: z.string().max(120).optional().nullable(),
  status: z.enum(qaStatuses).default("NEW"),
  relatedType: z.string().max(80).optional().nullable(),
  relatedId: z.string().max(180).optional().nullable()
});

export const updateQaItemSchema = qaItemSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required."
});

export function normalizeFormInput<T extends { name?: string; slug?: string | null }>(input: T) {
  return {
    ...input,
    slug: input.slug ? slugify(input.slug) : input.name ? slugify(input.name) : undefined
  };
}

export function normalizeQaInput<T extends { title?: string; slug?: string | null }>(input: T) {
  return {
    ...input,
    slug: input.slug ? slugify(input.slug) : input.title ? slugify(input.title) : undefined
  };
}
