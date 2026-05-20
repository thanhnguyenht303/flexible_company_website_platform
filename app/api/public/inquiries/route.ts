import { ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { contactInquirySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = contactInquirySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const inquiry = await prisma.inquiry.create({
    data: {
      ...parsed.data,
      phone: parsed.data.phone || null,
      companyName: parsed.data.companyName || null,
      sourceId: parsed.data.sourceId || null
    }
  });

  return ok({ id: inquiry.id }, { status: 201 });
}
