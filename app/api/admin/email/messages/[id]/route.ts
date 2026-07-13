import { z } from "zod";
import { EmailStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { requireEmailAdmin } from "@/modules/email/email.admin";

type Params = { params: Promise<{ id: string }> };
const patchSchema = z.object({ read: z.boolean().optional(), archived: z.boolean().optional() }).refine((value) => value.read !== undefined || value.archived !== undefined);

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const message = await prisma.emailMessage.findUnique({ where: { id: (await params).id }, include: { template: true } });
  return message ? ok(message) : fail("NOT_FOUND", "Email message not found.", 404);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireEmailAdmin();
  if (auth.error) return auth.error;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const { id } = await params;
  const existing = await prisma.emailMessage.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Email message not found.", 404);
  return ok(await prisma.emailMessage.update({
    where: { id },
    data: {
      ...(parsed.data.read !== undefined ? { readAt: parsed.data.read ? new Date() : null } : {}),
      ...(parsed.data.archived !== undefined ? { status: parsed.data.archived ? EmailStatus.ARCHIVED : existing.direction === "INBOUND" ? EmailStatus.RECEIVED : existing.status } : {})
    }
  }));
}
