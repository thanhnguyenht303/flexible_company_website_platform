import { NextRequest, NextResponse } from "next/server";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/admin/") && request.nextUrl.pathname !== "/api/admin/login") {
    if (!(await hasValidAdminSession(request))) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: 401 }
      );
    }
  }

  if (request.nextUrl.pathname.startsWith("/api/admin/") && unsafeMethods.has(request.method)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    if (!host || !isSameOrigin(origin, referer, host)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CSRF_CHECK_FAILED",
            message: "Request origin is not allowed."
          }
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

async function hasValidAdminSession(request: NextRequest) {
  const configuredName = process.env.SESSION_COOKIE_NAME ?? "__Host-cw_session";
  const cookieNames = [configuredName, configuredName.replace(/^__(Host|Secure)-/, "")];
  const value = cookieNames.map((name) => request.cookies.get(name)?.value).find(Boolean);
  if (!value) return false;

  const [body, signature] = value.split(".");
  const secret = process.env.APP_SECRET;
  if (!body || !signature || !secret) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const expected = bytesToBase64Url(new Uint8Array(signed));
    if (signature !== expected) return false;

    const json = new TextDecoder().decode(base64UrlToBytes(body));
    const payload = JSON.parse(json) as { userId?: string; expiresAt?: number };
    return Boolean(payload.userId && payload.expiresAt && payload.expiresAt >= Date.now());
  } catch {
    return false;
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isSameOrigin(origin: string | null, referer: string | null, host: string) {
  const expectedHosts = new Set([host, `www.${host}`]);

  if (origin) return expectedHosts.has(getHost(origin));
  if (referer) return expectedHosts.has(getHost(referer));

  return false;
}

function getHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

export const config = {
  matcher: ["/api/admin/:path*"]
};
