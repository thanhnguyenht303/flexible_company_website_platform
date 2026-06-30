import { z } from "zod";

const insecureSecretValues = new Set([
  "development-secret-change-this-32chars",
  "change-this-long-random-secret-at-least-32-chars",
  "replace-with-a-random-64-character-hex-secret"
]);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
    APP_NAME: z.string().default("Flexible Company Website"),
    APP_SECRET: z
      .string()
      .min(32, "APP_SECRET must be at least 32 characters")
      .default("development-secret-change-this-32chars"),
    DATABASE_URL: z.string().min(1),
    UPLOAD_DRIVER: z.enum(["local", "s3"]).default("local"),
    LOCAL_UPLOAD_DIR: z.string().default("public/uploads"),
    MAX_UPLOAD_MB: z.coerce.number().positive().default(10),
    MAX_FILE_UPLOAD_MB: z.coerce.number().positive().default(10),
    ALLOWED_UPLOAD_TYPES: z
      .string()
      .default("image/jpeg,image/png,image/webp,application/pdf"),
    SESSION_COOKIE_NAME: z.string().default("__Host-cw_session"),
    SESSION_EXPIRES_HOURS: z.coerce.number().positive().default(24),
    SESSION_EXPIRES_DAYS: z.coerce.number().positive().optional(),
    PASSWORD_MIN_LENGTH: z.coerce.number().min(10).default(10),
    RATE_LIMIT_LOGIN_PER_MINUTE: z.coerce.number().positive().default(5)
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== "production") return;

    if (insecureSecretValues.has(value.APP_SECRET)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["APP_SECRET"],
        message: "APP_SECRET must be a unique production secret."
      });
    }

    const siteUrl = new URL(value.NEXT_PUBLIC_SITE_URL);
    const isLocalhost = siteUrl.hostname === "localhost" || siteUrl.hostname === "127.0.0.1" || siteUrl.hostname === "[::1]";

    if (!isLocalhost && siteUrl.protocol !== "https:") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_SITE_URL"],
        message: "NEXT_PUBLIC_SITE_URL must use https:// in production."
      });
    }
  });

export const env = envSchema.parse(process.env);
