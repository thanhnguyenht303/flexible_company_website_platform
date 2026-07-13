import { sendAdminNotification } from "@/modules/email/email.service";

type FormNotification = {
  recipients: string[];
  subject: string;
  lines: string[];
  replyTo?: string | null;
  relatedType?: string;
  relatedId?: string;
  templateKey?: string;
  variables?: Record<string, string | number | boolean | null | undefined>;
};

export async function sendFormNotification({ recipients, subject, lines, replyTo, relatedType = "formSubmission", relatedId = "unknown", templateKey, variables }: FormNotification) {
  return sendAdminNotification({
    recipients,
    subject,
    body: lines.join("\n"),
    replyTo,
    relatedType,
    relatedId,
    templateKey,
    variables
  });
}
