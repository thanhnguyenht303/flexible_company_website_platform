type FormNotification = {
  recipients: string[];
  subject: string;
  lines: string[];
  replyTo?: string | null;
};

export async function sendFormNotification({ recipients, subject, lines, replyTo }: FormNotification) {
  if (!recipients.length) return;

  const driver = process.env.MAIL_DRIVER ?? "none";
  if (driver === "none") return;

  // SMTP/provider delivery is intentionally centralized here so the form workflow
  // stores submissions even when email infrastructure is not configured yet.
  console.warn("MAIL_DRIVER is configured, but no mail provider adapter is implemented yet.", {
    recipients,
    subject,
    replyTo,
    preview: lines.slice(0, 8)
  });
}
