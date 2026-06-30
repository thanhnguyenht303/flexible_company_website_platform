/** @type {import('next').NextConfig} */
const configuredOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").host;
  } catch {
    return "localhost:3000";
  }
})();

const isLocalOrigin =
  configuredOrigin === "localhost:3000" ||
  configuredOrigin.startsWith("localhost:") ||
  configuredOrigin.startsWith("127.0.0.1:") ||
  configuredOrigin.startsWith("[::1]:");

const scriptSrc = ["'self'", "'unsafe-inline'"];
if (process.env.NODE_ENV !== "production" || isLocalOrigin) {
  scriptSrc.push("'unsafe-eval'");
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline'",
  `script-src ${scriptSrc.join(" ")}`,
  "connect-src 'self'",
  "form-action 'self'"
].join("; ");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: `${contentSecurityPolicy};`
          }
        ]
      }
    ];
  }
};

export default nextConfig;
