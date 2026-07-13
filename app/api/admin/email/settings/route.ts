import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { encryptEmailSecret } from "@/lib/email-crypto";
import { resolvePublicHost } from "@/lib/outbound-host";
import { publicEmailSettings, requireEmailAdmin } from "@/modules/email/email.admin";
import { emailSettingsSchema } from "@/modules/email/email.validation";

export async function GET() {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const settings = await prisma.emailSettings.findUnique({ where: { id: "default" } });
  return ok(publicEmailSettings(settings));
}

export async function PATCH(request: Request) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const parsed = emailSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const value = parsed.data;
  try {
    await Promise.all(
      [value.smtpHost, value.imapHost]
        .filter((host): host is string => Boolean(host))
        .map((host) => resolvePublicHost(host))
    );
  } catch {
    return fail("UNSAFE_MAIL_HOST", "Mail server hosts must resolve only to public IP addresses.", 422);
  }
  const data = {
    defaultReceivingEmail: value.defaultReceivingEmail || null,
    defaultSenderName: value.defaultSenderName || null,
    defaultSenderEmail: value.defaultSenderEmail || null,
    replyToEmail: value.replyToEmail || null,
    notificationEmails: value.notificationEmails,
    ccEmails: value.ccEmails,
    bccEmails: value.bccEmails,
    emailNotificationsEnabled: value.emailNotificationsEnabled,
    smtpHost: value.smtpHost || null,
    smtpPort: value.smtpPort || null,
    smtpUsername: value.smtpUsername || null,
    smtpSecure: value.smtpSecure,
    imapHost: value.imapHost || null,
    imapPort: value.imapPort || null,
    imapUsername: value.imapUsername || null,
    imapSecure: value.imapSecure,
    inboundEmailAddress: value.inboundEmailAddress || null,
    ...(value.clearSmtpPassword
      ? { smtpPasswordEncrypted: null }
      : value.smtpPassword
        ? { smtpPasswordEncrypted: encryptEmailSecret(value.smtpPassword) }
        : {}),
    ...(value.clearImapPassword
      ? { imapPasswordEncrypted: null }
      : value.imapPassword
        ? { imapPasswordEncrypted: encryptEmailSecret(value.imapPassword) }
        : {}),
    ...(value.clearInboundWebhookSecret
      ? { inboundWebhookSecretEncrypted: null }
      : value.inboundWebhookSecret
        ? { inboundWebhookSecretEncrypted: encryptEmailSecret(value.inboundWebhookSecret) }
        : {})
  };
  const settings = await prisma.emailSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data
  });
  return ok(publicEmailSettings(settings));
}
