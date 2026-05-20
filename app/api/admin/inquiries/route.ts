import { InquiryStatus } from "@prisma/client";
import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

const updateInquirySchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(InquiryStatus).optional(),
  internalNote: z.string().max(5000).optional().nullable()
});

export async function GET() {
  const user = await requireAdminUser();
  if (!hasPermission(user, "inquiries.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return ok(inquiries);
}

export async function PATCH(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "inquiries.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const parsed = updateInquirySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const { id, ...data } = parsed.data;
  const inquiry = await prisma.inquiry.update({ where: { id }, data });
  return ok(inquiry);
}
