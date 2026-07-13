import { fail, ok } from "@/lib/api-response";
import { requireEmailAdmin } from "@/modules/email/email.admin";
import { testImapConnection } from "@/modules/email/email.imap";

export async function POST() {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  try {
    await testImapConnection();
    return ok({ connected: true });
  } catch (error) {
    return fail("IMAP_CONNECTION_FAILED", error instanceof Error ? error.message : "IMAP connection failed.", 422);
  }
}
