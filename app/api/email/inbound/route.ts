import { timingSafeEqual } from "crypto";
import { EmailDirection, EmailStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { decryptEmailSecret } from "@/lib/email-crypto";
import { inboundEmailSchema } from "@/modules/email/email.validation";

export async function POST(request: Request) {
  const settings = await prisma.emailSettings.findUnique({ where: { id: "default" } });
  const expected = decryptEmailSecret(settings?.inboundWebhookSecretEncrypted);
  const provided = request.headers.get("x-email-webhook-secret");
  if (!expected || !provided || !safeEqual(expected, provided)) return fail("UNAUTHORIZED", "Invalid inbound webhook secret.", 401);
  const parsed = inboundEmailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const value = parsed.data;

  const related = value.inReplyTo
    ? await prisma.emailMessage.findFirst({ where: { providerMessageId: value.inReplyTo }, select: { relatedType: true, relatedId: true } })
    : null;
  const message = await prisma.emailMessage.create({
    data: {
      direction: EmailDirection.INBOUND,
      status: EmailStatus.RECEIVED,
      fromEmail: value.fromEmail,
      fromName: value.fromName,
      toEmails: value.toEmails,
      ccEmails: value.ccEmails ?? [],
      subject: value.subject,
      body: value.body,
      bodyHtml: value.bodyHtml,
      providerMessageId: value.providerMessageId,
      inReplyTo: value.inReplyTo,
      referencesHeader: value.references,
      relatedType: related?.relatedType,
      relatedId: related?.relatedId,
      receivedAt: value.receivedAt ? new Date(value.receivedAt) : new Date()
    }
  });
  return ok({ id: message.id }, { status: 201 });
}

function safeEqual(expected: string, actual: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}
