import "server-only";

import { fail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { hasAuthority } from "@/lib/permissions";

export async function requireEmailAdmin() {
  const user = await requireAdminUser();
  return hasAuthority(user, "email.manage")
    ? { user, error: null }
    : { user: null, error: fail("FORBIDDEN", "Forbidden.", 403) };
}

export function publicEmailSettings<T extends {
  smtpPasswordEncrypted?: string | null;
  imapPasswordEncrypted?: string | null;
  inboundWebhookSecretEncrypted?: string | null;
}>(settings: T | null) {
  if (!settings) return null;
  const { smtpPasswordEncrypted, imapPasswordEncrypted, inboundWebhookSecretEncrypted, ...safe } = settings;
  return {
    ...safe,
    hasSmtpPassword: Boolean(smtpPasswordEncrypted),
    hasImapPassword: Boolean(imapPasswordEncrypted),
    hasInboundWebhookSecret: Boolean(inboundWebhookSecretEncrypted)
  };
}
