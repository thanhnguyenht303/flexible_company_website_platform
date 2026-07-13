import { fail, ok } from "@/lib/api-response";
import { requireEmailAdmin } from "@/modules/email/email.admin";
import { syncImapInbox } from "@/modules/email/email.imap";

export async function POST() {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  try {
    return ok(await syncImapInbox());
  } catch (error) {
    return fail("IMAP_SYNC_FAILED", error instanceof Error ? error.message : "Inbox synchronization failed.", 422);
  }
}
