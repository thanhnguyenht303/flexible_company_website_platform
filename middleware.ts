import { NextRequest, NextResponse } from "next/server";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest) {
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
