import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { contactInquirySchema } from "@/lib/validation";
import { env } from "@/lib/env";
import { sendAdminNotification } from "@/modules/email/email.service";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: `public:inquiry:${getClientIp(request)}`,
    limit: 5,
    windowMs: 60_000
  });
  if (!rateLimit.allowed) {
    return fail("RATE_LIMITED", `Too many submissions. Try again in ${rateLimit.retryAfterSeconds} seconds.`, 429);
  }

  const body = await request.json().catch(() => null);
  if (isHoneypotFilled(body)) {
    return fail("VALIDATION_ERROR", "Please check the submitted data.", 422);
  }

  const parsed = contactInquirySchema.safeParse(body);
  if (!parsed.success) return validationFail(parsed.error);

  const inquiry = await prisma.inquiry.create({
    data: {
      ...parsed.data,
      phone: parsed.data.phone || null,
      companyName: parsed.data.companyName || null,
      sourceId: parsed.data.sourceId || null
    }
  });

  await sendAdminNotification({
    templateKey: "contact.message.received",
    subject: `New contact message from ${inquiry.name}`,
    body: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone || "Not provided"}\n\n${inquiry.message}\n\nReview: ${env.NEXT_PUBLIC_SITE_URL}/admin/inquiries/${inquiry.id}`,
    variables: {
      senderName: inquiry.name,
      senderEmail: inquiry.email,
      senderPhone: inquiry.phone || "Not provided",
      message: inquiry.message,
      adminLink: `${env.NEXT_PUBLIC_SITE_URL}/admin/inquiries/${inquiry.id}`
    },
    replyTo: inquiry.email,
    relatedType: "inquiry",
    relatedId: inquiry.id
  }).catch((error) => console.warn("Inquiry notification failed.", error));

  return ok({ id: inquiry.id }, { status: 201 });
}

function isHoneypotFilled(value: unknown) {
  return (
    typeof value === "object" &&
    value !== null &&
    "website" in value &&
    typeof (value as { website?: unknown }).website === "string" &&
    (value as { website: string }).website.trim().length > 0
  );
}
