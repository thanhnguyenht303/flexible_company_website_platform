import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const encoder = new TextEncoder();

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", env.APP_SECRET).update(value).digest("base64url");
}

function serializeSession(payload: SessionPayload) {
  const body = base64Url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function parseSession(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const actualBytes = encoder.encode(signature);
  const expectedBytes = encoder.encode(expected);

  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createAdminSession(userId: string) {
  const expiresAt = Date.now() + env.SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
  cookies().set(env.SESSION_COOKIE_NAME, serializeSession({ userId, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/"
  });
}

export function destroyAdminSession() {
  cookies().delete(env.SESSION_COOKIE_NAME);
}

export async function getAdminUser() {
  const payload = parseSession(cookies().get(env.SESSION_COOKIE_NAME)?.value);
  if (!payload) return null;

  return prisma.user.findFirst({
    where: {
      id: payload.userId,
      status: UserStatus.ACTIVE
    },
    include: {
      role: true
    }
  });
}

export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
