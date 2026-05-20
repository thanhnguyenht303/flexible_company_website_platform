import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { createAdminSession } from "@/lib/auth";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    include: { role: true }
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    return fail("AUTH_FAILED", "Invalid username or password.", 401);
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return fail("AUTH_FAILED", "Invalid username or password.", 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  await createAdminSession(user.id);
  return ok({ user: { id: user.id, username: user.username, role: user.role.name } });
}
