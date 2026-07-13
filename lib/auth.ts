import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import type { AuthorityKey } from "@/config/admin-authorities";
import { hasAuthority } from "@/lib/permissions";

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

function getSessionCookieSecure() {
  try {
    return new URL(env.NEXT_PUBLIC_SITE_URL).protocol === "https:";
  } catch {
    return env.NODE_ENV === "production";
  }
}

function getSessionCookieName() {
  const secure = getSessionCookieSecure();
  if (secure) return env.SESSION_COOKIE_NAME;

  return env.SESSION_COOKIE_NAME.replace(/^__(Host|Secure)-/, "");
}

function getReadableSessionCookieNames() {
  const names = [getSessionCookieName()];
  if (!names.includes(env.SESSION_COOKIE_NAME)) names.push(env.SESSION_COOKIE_NAME);
  return names;
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
  const sessionHours = env.SESSION_EXPIRES_HOURS ?? (env.SESSION_EXPIRES_DAYS ?? 1) * 24;
  const expiresAt = Date.now() + sessionHours * 60 * 60 * 1000;
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), serializeSession({ userId, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: getSessionCookieSecure(),
    priority: "high",
    expires: new Date(expiresAt),
    path: "/"
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  for (const name of getReadableSessionCookieNames()) {
    cookieStore.delete(name);
  }
}

export async function getAdminUser() {
  const cookieStore = await cookies();
  const sessionValue = getReadableSessionCookieNames()
    .map((name) => cookieStore.get(name)?.value)
    .find(Boolean);
  const payload = parseSession(sessionValue);
  if (!payload) return null;

  return prisma.user.findFirst({
    where: {
      id: payload.userId,
      status: UserStatus.ACTIVE
    },
    include: {
      role: {
        include: {
          authorities: { include: { authority: true } }
        }
      }
    }
  });
}

export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireAdminAuthority(authorityKey: AuthorityKey) {
  const user = await requireAdminUser();
  if (!hasAuthority(user, authorityKey)) redirect("/admin/forbidden");
  return user;
}
