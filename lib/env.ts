import { z } from "zod";

const envSchema = z.object({
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
  ALLOWED_UPLOAD_TYPES: z
    .string()
    .default("image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"),
  SESSION_COOKIE_NAME: z.string().default("cw_session"),
  SESSION_EXPIRES_HOURS: z.coerce.number().positive().default(24),
  SESSION_EXPIRES_DAYS: z.coerce.number().positive().optional(),
  PASSWORD_MIN_LENGTH: z.coerce.number().min(10).default(10),
  RATE_LIMIT_LOGIN_PER_MINUTE: z.coerce.number().positive().default(5)
});

export const env = envSchema.parse(process.env);
