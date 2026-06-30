import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { createAdminSession } from "@/lib/auth";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return validationFail(parsed.error);

  const ipLimit = checkRateLimit({
    key: `login:ip:${ip}`,
    limit: env.RATE_LIMIT_LOGIN_PER_MINUTE,
    windowMs: 60_000
  });
  if (!ipLimit.allowed) {
    return fail("RATE_LIMITED", `Too many login attempts. Try again in ${ipLimit.retryAfterSeconds} seconds.`, 429);
  }

  const usernameLimit = checkRateLimit({
    key: `login:user:${parsed.data.username.toLowerCase()}`,
    limit: env.RATE_LIMIT_LOGIN_PER_MINUTE * 2,
    windowMs: 5 * 60_000
  });
  if (!usernameLimit.allowed) {
    return fail("RATE_LIMITED", `Too many login attempts. Try again in ${usernameLimit.retryAfterSeconds} seconds.`, 429);
  }

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
