import { z } from "zod";
import { getTemplateVariables } from "./email.variables";

const optionalEmail = z.string().trim().email().max(254).optional().or(z.literal(""));
const emailList = z.array(z.string().trim().email().max(254)).max(50).default([]);

export const emailSettingsSchema = z.object({
  defaultReceivingEmail: optionalEmail,
  defaultSenderName: z.string().trim().max(120).optional().or(z.literal("")),
  defaultSenderEmail: optionalEmail,
  replyToEmail: optionalEmail,
  notificationEmails: emailList,
  ccEmails: emailList,
  bccEmails: emailList,
  emailNotificationsEnabled: z.boolean().default(true),
  smtpHost: z.string().trim().max(255).optional().or(z.literal("")),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  smtpUsername: z.string().trim().max(255).optional().or(z.literal("")),
  smtpPassword: z.string().max(1000).optional().or(z.literal("")),
  clearSmtpPassword: z.boolean().optional(),
  smtpSecure: z.boolean().default(false),
  imapHost: z.string().trim().max(255).optional().or(z.literal("")),
  imapPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  imapUsername: z.string().trim().max(255).optional().or(z.literal("")),
  imapPassword: z.string().max(1000).optional().or(z.literal("")),
  clearImapPassword: z.boolean().optional(),
  imapSecure: z.boolean().default(true),
  inboundEmailAddress: optionalEmail,
  inboundWebhookSecret: z.string().min(24).max(500).optional().or(z.literal("")),
  clearInboundWebhookSecret: z.boolean().optional()
});

export const customTemplateVariableSchema = z.object({
  key: z.string().trim().regex(/^[A-Za-z][A-Za-z0-9]*$/, "Use letters and numbers only, starting with a letter.").max(80),
  label: z.string().trim().min(1).max(120),
  sourceType: z.enum(["registered", "fixed"]),
  sourceKey: z.string().trim().max(80).optional().or(z.literal("")),
  fixedValue: z.string().max(10_000).optional().or(z.literal("")),
  sampleValue: z.string().max(500).optional().or(z.literal("")),
  fallback: z.string().max(500).optional().or(z.literal(""))
}).superRefine((value, context) => {
  if (value.sourceType === "registered" && !value.sourceKey) context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceKey"], message: "Choose a registered data source." });
  if (value.sourceType === "fixed" && !value.fixedValue) context.addIssue({ code: z.ZodIssueCode.custom, path: ["fixedValue"], message: "Enter the fixed value." });
});

export const emailTemplateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  key: z.string().trim().regex(/^[a-z0-9][a-z0-9._-]*$/).max(120),
  category: z.enum(["career", "lead", "contact", "form", "qa", "service", "product", "general"]),
  language: z.enum(["en", "vi"]),
  subject: z.string().trim().min(1).max(300),
  body: z.string().min(1).max(100_000),
  isActive: z.boolean().default(true),
  variables: z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/)).max(100).default([]),
  customVariables: z.array(customTemplateVariableSchema).max(50).default([])
}).superRefine((value, context) => {
  const standardKeys = new Set(getTemplateVariables(value.category).map((item) => item.key));
  const customKeys = new Set<string>();
  value.customVariables.forEach((item, index) => {
    if (standardKeys.has(item.key)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["customVariables", index, "key"], message: "This key is already a standard variable." });
    if (customKeys.has(item.key)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["customVariables", index, "key"], message: "Custom variable keys must be unique." });
    customKeys.add(item.key);
    if (item.sourceType === "registered" && !standardKeys.has(item.sourceKey || "")) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["customVariables", index, "sourceKey"], message: "The selected source is not available for this category." });
    }
  });
});

export const sendEmailSchema = z.object({
  to: emailList.refine((items) => items.length > 0, "At least one recipient is required."),
  cc: emailList.optional(),
  bcc: emailList.optional(),
  subject: z.string().trim().min(1).max(300),
  body: z.string().min(1).max(100_000),
  templateId: z.string().cuid().optional().nullable(),
  variables: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  relatedType: z.string().trim().max(80).optional().nullable(),
  relatedId: z.string().trim().max(160).optional().nullable(),
  replyTo: optionalEmail,
  statusAction: z.enum(["ACCEPTED", "REJECTED", "INTERVIEW", "NEED_MORE_INFO"]).optional()
});

export const inboundEmailSchema = z.object({
  fromEmail: z.string().email().max(254),
  fromName: z.string().max(120).optional(),
  toEmails: emailList,
  ccEmails: emailList.optional(),
  subject: z.string().max(300).default("(No subject)"),
  body: z.string().max(500_000),
  bodyHtml: z.string().max(1_000_000).optional(),
  providerMessageId: z.string().max(500).optional(),
  inReplyTo: z.string().max(500).optional(),
  references: z.string().max(2000).optional(),
  receivedAt: z.string().datetime().optional()
});
