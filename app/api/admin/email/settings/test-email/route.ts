import { fail, ok, validationFail } from "@/lib/api-response";
import { requireEmailAdmin } from "@/modules/email/email.admin";
import { sendEmail } from "@/modules/email/email.service";
import { z } from "zod";

const schema = z.object({ to: z.string().email() });

export async function POST(request: Request) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const message = await sendEmail({
    to: [parsed.data.to],
    subject: "Email Center test message",
    body: "Your outgoing email configuration is working.",
    sentByUserId: auth.user.id,
    relatedType: "emailSettings",
    relatedId: "default"
  });
  return message.status === "SENT" ? ok(message) : fail("EMAIL_SEND_FAILED", message.errorMessage || "Email failed to send.", 422);
}
