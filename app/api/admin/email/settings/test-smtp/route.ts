import { fail, ok } from "@/lib/api-response";
import { requireEmailAdmin } from "@/modules/email/email.admin";
import { testSmtpConnection } from "@/modules/email/email.service";

export async function POST() {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  try {
    await testSmtpConnection();
    return ok({ connected: true });
  } catch (error) {
    return fail("SMTP_CONNECTION_FAILED", error instanceof Error ? error.message : "SMTP connection failed.", 422);
  }
}
