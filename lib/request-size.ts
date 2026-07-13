import { fail } from "@/lib/api-response";

export function rejectOversizedRequest(request: Request, maxMb: number, label = "Request") {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return null;

  const sizeBytes = Number(contentLength);
  const maxBytes = maxMb * 1024 * 1024;

  if (Number.isFinite(sizeBytes) && sizeBytes >= 0 && sizeBytes <= maxBytes) return null;

  return fail("REQUEST_TOO_LARGE", `${label} exceeds ${maxMb}MB.`, 413);
}

export async function readRequestWithBodyLimit(request: Request, maxMb: number, label = "Request") {
  const oversized = rejectOversizedRequest(request, maxMb, label);
  if (oversized) return { response: oversized } as const;
  if (!request.body) return { request } as const;

  const maxBytes = Math.floor(maxMb * 1024 * 1024);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let sizeBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    sizeBytes += value.byteLength;
    if (sizeBytes > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { response: fail("REQUEST_TOO_LARGE", `${label} exceeds ${maxMb}MB.`, 413) } as const;
    }
    chunks.push(value);
  }

  const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), sizeBytes);
  const headers = new Headers(request.headers);
  headers.set("content-length", String(sizeBytes));
  return {
    request: new Request(request.url, { method: request.method, headers, body })
  } as const;
}
