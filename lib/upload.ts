import { env } from "@/lib/env";

export function getAllowedUploadTypes(): string[] {
  return env.ALLOWED_UPLOAD_TYPES.split(",").map((type) => type.trim());
}

export function assertUploadAllowed(file: { type: string; size: number }) {
  const allowedTypes = getAllowedUploadTypes();
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed.`);
  }

  if (file.size > maxBytes) {
    throw new Error(`File exceeds ${env.MAX_UPLOAD_MB}MB.`);
  }
}
