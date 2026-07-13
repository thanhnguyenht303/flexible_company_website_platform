import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { requireEmailAdmin } from "@/modules/email/email.admin";
import { sendEmail } from "@/modules/email/email.service";

type Params = { params: Promise<{ id: string }> };
const schema = z.object({ body: z.string().min(1).max(100_000) });

export async function POST(request: Request, { params }: Params) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const original = await prisma.emailMessage.findUnique({ where: { id: (await params).id } });
  if (!original) return fail("NOT_FOUND", "Email message not found.", 404);
  const to = original.direction === "INBOUND" ? [original.fromEmail ?? ""] : original.toEmails;
  const message = await sendEmail({
    to,
    subject: original.subject.toLowerCase().startsWith("re:") ? original.subject : `Re: ${original.subject}`,
    body: parsed.data.body,
    relatedType: original.relatedType,
    relatedId: original.relatedId,
    sentByUserId: auth.user.id,
    metadata: { replyToMessageId: original.id, inReplyTo: original.providerMessageId }
  });
  return message.status === "SENT" ? ok(message) : fail("EMAIL_SEND_FAILED", message.errorMessage || "Email failed to send.", 422);
}
