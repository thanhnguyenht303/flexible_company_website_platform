import { JobApplicationStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { hasAuthority } from "@/lib/permissions";
import { requireEmailAdmin } from "@/modules/email/email.admin";
import { sendEmailSchema } from "@/modules/email/email.validation";
import { sendEmail } from "@/modules/email/email.service";
import { normalizeCustomTemplateVariables, suggestTemplateVariable, validateTemplateContent } from "@/modules/email/email.variables";

export async function POST(request: Request) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const parsed = sendEmailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const value = parsed.data;
  if (value.statusAction && value.relatedType === "jobApplication" && !hasAuthority(auth.user, "careers.manage")) {
    return fail("CAREERS_AUTHORITY_REQUIRED", "Careers authority is required to update an application status.", 403);
  }

  const template = value.templateId
    ? await prisma.emailTemplate.findFirst({ where: { id: value.templateId, isActive: true } })
    : null;
  if (value.templateId && !template) return fail("TEMPLATE_NOT_FOUND", "Active email template not found.", 404);
  if (template) {
    const customVariables = normalizeCustomTemplateVariables(template.customVariables);
    const unknown = validateTemplateContent(template.subject, template.body, template.category, customVariables);
    if (unknown.length) {
      const first = unknown[0];
      const suggestion = suggestTemplateVariable(first.key, template.category, customVariables);
      return fail(
        "UNKNOWN_TEMPLATE_VARIABLE",
        `Unknown variable: ${first.syntax}. This variable will not be replaced.${suggestion ? ` Did you mean {{${suggestion}}}?` : ""}`,
        422,
        { template: `Use only variables registered for the ${template.category} category.` }
      );
    }
  }

  const message = await sendEmail({
    to: value.to,
    cc: value.cc,
    bcc: value.bcc,
    subject: value.subject,
    body: value.body,
    originalTemplateSubject: template?.subject,
    originalTemplateBody: template?.body,
    templateId: template?.id,
    templateCategory: template?.category,
    customVariables: normalizeCustomTemplateVariables(template?.customVariables),
    language: template?.language === "vi" ? "vi" : "en",
    variables: value.variables,
    relatedType: value.relatedType,
    relatedId: value.relatedId,
    replyTo: value.replyTo,
    sentByUserId: auth.user.id
  });

  if (message.status === "SENT" && value.statusAction && value.relatedType === "jobApplication" && value.relatedId) {
    await prisma.jobApplication.updateMany({
      where: { id: value.relatedId },
      data: { status: value.statusAction as JobApplicationStatus }
    });
  }

  return message.status === "SENT"
    ? ok(message)
    : fail("EMAIL_SEND_FAILED", message.errorMessage || "Email failed to send.", 422);
}
