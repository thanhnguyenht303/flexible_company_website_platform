import "server-only";

import nodemailer from "nodemailer";
import { isIP } from "net";
import { EmailDirection, EmailStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptEmailSecret } from "@/lib/email-crypto";
import { resolvePublicHost } from "@/lib/outbound-host";
import { renderTemplate } from "@/modules/email/email.render";
import { getMissingValueFallback, normalizeCustomTemplateVariables, renderRegisteredTemplate, validateTemplateContent, type CustomEmailTemplateVariable } from "@/modules/email/email.variables";

export { renderTemplate } from "@/modules/email/email.render";

type Primitive = string | number | boolean | null | undefined;

export type SendEmailInput = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  originalTemplateSubject?: string | null;
  originalTemplateBody?: string | null;
  html?: string | null;
  replyTo?: string | null;
  templateId?: string | null;
  templateCategory?: string | null;
  customVariables?: CustomEmailTemplateVariable[];
  language?: "en" | "vi";
  variables?: Record<string, Primitive>;
  relatedType?: string | null;
  relatedId?: string | null;
  sentByUserId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function getEmailSettings() {
  return prisma.emailSettings.findUnique({ where: { id: "default" } });
}

export async function testSmtpConnection() {
  const settings = await getEmailSettings();
  const transport = await createTransport(settings);
  if (!transport) throw new Error("SMTP is not configured.");
  await transport.verify();
}

export async function sendEmail(input: SendEmailInput) {
  const settings = await getEmailSettings();
  const fallback = getMissingValueFallback(input.language === "vi" ? "vi" : "en");
  const subject = input.templateCategory
      ? renderRegisteredTemplate(input.subject, input.templateCategory, input.variables ?? {}, fallback, input.customVariables)
    : renderTemplate(input.subject, input.variables);
  const body = input.templateCategory
      ? renderRegisteredTemplate(input.body, input.templateCategory, input.variables ?? {}, fallback, input.customVariables)
    : renderTemplate(input.body, input.variables);
  const renderedHtml = input.html
    ? input.templateCategory
      ? renderRegisteredTemplate(input.html, input.templateCategory, input.variables ?? {}, fallback, input.customVariables)
      : renderTemplate(input.html, input.variables)
    : plainTextToHtml(body);
  const unknownVariables = input.templateCategory ? validateTemplateContent(input.subject, input.body, input.templateCategory, input.customVariables) : [];
  const to = uniqueEmails(input.to);
  const cc = uniqueEmails(input.cc ?? []);
  const bcc = uniqueEmails(input.bcc ?? []);
  const fromEmail = settings?.defaultSenderEmail || process.env.SMTP_FROM || null;
  const fromName = settings?.defaultSenderName || process.env.APP_NAME || null;

  const message = await prisma.emailMessage.create({
    data: {
      direction: EmailDirection.OUTBOUND,
      status: EmailStatus.QUEUED,
      fromEmail,
      fromName,
      toEmails: to,
      ccEmails: cc,
      bccEmails: bcc,
      replyToEmail: input.replyTo || settings?.replyToEmail || null,
      subject,
      body,
      bodyHtml: renderedHtml,
      templateId: input.templateId || null,
      relatedType: input.relatedType || null,
      relatedId: input.relatedId || null,
      sentByUserId: input.sentByUserId || null,
      metadata: {
        ...(isJsonObject(input.metadata) ? input.metadata : input.metadata === undefined ? {} : { inputMetadata: input.metadata }),
        originalSubject: input.originalTemplateSubject ?? input.subject,
        originalBody: input.originalTemplateBody ?? input.body,
        ...(input.templateCategory ? { templateCategory: input.templateCategory } : {}),
        ...(unknownVariables.length ? { unknownVariables: unknownVariables.map((item) => item.syntax) } : {})
      }
    }
  });

  try {
    if (unknownVariables.length) throw new Error(`Unknown template variable${unknownVariables.length === 1 ? "" : "s"}: ${unknownVariables.map((item) => item.syntax).join(", ")}.`);
    if (!to.length) throw new Error("No recipient email is configured.");
    if (!fromEmail) throw new Error("No sender email is configured.");
    const transport = await createTransport(settings);
    if (!transport) throw new Error("SMTP is not configured.");

    const result = await transport.sendMail({
      from: fromName ? { name: fromName, address: fromEmail } : fromEmail,
      to,
      cc,
      bcc,
      replyTo: input.replyTo || settings?.replyToEmail || undefined,
      subject,
      text: body,
      html: renderedHtml,
      headers: {
        "X-Email-Center-Message": message.id,
        ...(input.relatedType && input.relatedId
          ? { "X-Related-Entity": `${input.relatedType}:${input.relatedId}` }
          : {})
      }
    });

    return prisma.emailMessage.update({
      where: { id: message.id },
      data: { status: EmailStatus.SENT, providerMessageId: result.messageId, sentAt: new Date() }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Email delivery failed.";
    return prisma.emailMessage.update({
      where: { id: message.id },
      data: { status: EmailStatus.FAILED, errorMessage }
    });
  }
}

export async function sendTemplateEmail(input: Omit<SendEmailInput, "subject" | "body"> & { templateKey: string; language?: string }) {
  const template = await prisma.emailTemplate.findUnique({
    where: { key_language: { key: input.templateKey, language: input.language ?? "en" } }
  });
  if (!template?.isActive) throw new Error(`Active email template not found: ${input.templateKey}`);
  return sendEmail({ ...input, subject: template.subject, body: template.body, templateId: template.id, templateCategory: template.category, customVariables: normalizeCustomTemplateVariables(template.customVariables), language: template.language === "vi" ? "vi" : "en" });
}

export async function sendAdminNotification(input: {
  recipients?: string[];
  templateKey?: string;
  subject: string;
  body: string;
  variables?: Record<string, Primitive>;
  replyTo?: string | null;
  relatedType: string;
  relatedId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const settings = await getEmailSettings();
  if (settings && !settings.emailNotificationsEnabled) return null;
  const recipients = uniqueEmails([
    ...(input.recipients ?? []),
    ...((input.recipients?.length ?? 0) ? [] : settings?.notificationEmails ?? []),
    ...((input.recipients?.length ?? 0) || (settings?.notificationEmails.length ?? 0) ? [] : [settings?.defaultReceivingEmail ?? ""])
  ]);

  if (input.templateKey) {
    const template = await prisma.emailTemplate.findUnique({ where: { key_language: { key: input.templateKey, language: "en" } } });
    if (template?.isActive) {
      return sendEmail({
        to: recipients,
        cc: settings?.ccEmails,
        bcc: settings?.bccEmails,
        subject: template.subject,
        body: template.body,
        variables: input.variables,
        replyTo: input.replyTo,
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        templateId: template.id,
        templateCategory: template.category,
        customVariables: normalizeCustomTemplateVariables(template.customVariables),
        language: template.language === "vi" ? "vi" : "en",
        metadata: input.metadata
      });
    }
  }

  return sendEmail({
    to: recipients,
    cc: settings?.ccEmails,
    bcc: settings?.bccEmails,
    subject: input.subject,
    body: input.body,
    variables: input.variables,
    replyTo: input.replyTo,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    metadata: input.metadata
  });
}

async function createTransport(settings: Awaited<ReturnType<typeof getEmailSettings>>) {
  const host = settings?.smtpHost || process.env.SMTP_HOST;
  const port = settings?.smtpPort || Number(process.env.SMTP_PORT || 587);
  const user = settings?.smtpUsername || process.env.SMTP_USER;
  const password = decryptEmailSecret(settings?.smtpPasswordEncrypted) || process.env.SMTP_PASSWORD;
  if (!host) return null;
  const endpoint = await resolvePublicHost(host);

  return nodemailer.createTransport({
    host: endpoint.address,
    port,
    secure: settings?.smtpSecure ?? port === 465,
    auth: user && password ? { user, pass: password } : undefined,
    tls: isIP(endpoint.hostname) ? undefined : { servername: endpoint.hostname },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000
  });
}

function uniqueEmails(values: string[]) {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

function plainTextToHtml(value: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-wrap">${escapeHtml(value)}</div>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function isJsonObject(value: Prisma.InputJsonValue | undefined): value is Prisma.InputJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
