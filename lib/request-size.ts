import { fail } from "@/lib/api-response";

export function rejectOversizedRequest(request: Request, maxMb: number, label = "Request") {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return null;

  const sizeBytes = Number(contentLength);
  const maxBytes = maxMb * 1024 * 1024;

  if (!Number.isFinite(sizeBytes) || sizeBytes <= maxBytes) return null;

  return fail("REQUEST_TOO_LARGE", `${label} exceeds ${maxMb}MB.`, 413);
}
