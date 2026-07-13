import { ok } from "@/lib/api-response";
import { requireEmailAdmin } from "@/modules/email/email.admin";
import { listEmailMessages } from "@/modules/email/email.queries";

export async function GET(request: Request) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  return ok(await listEmailMessages(request));
}
