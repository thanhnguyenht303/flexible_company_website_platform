import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-response", async () => import("../lib/api-response"));

import { csvCell } from "../lib/csv";
import { getRequestedGalleryRemovalIds } from "../lib/gallery-assets";
import { isPublicIpAddress, resolvePublicHost } from "../lib/outbound-host";
import { getPrivateFileAuthority } from "../lib/private-file-policy";
import { getClientIp } from "../lib/rate-limit";
import { readRequestWithBodyLimit } from "../lib/request-size";

describe("security hardening policies", () => {
  it("maps private file categories to exactly one owning authority", () => {
    expect(getPrivateFileAuthority("job-application-resume")).toBe("careers.manage");
    expect(getPrivateFileAuthority("form-submission-file")).toBe("forms.manage");
    expect(getPrivateFileAuthority("unknown-private-file")).toBeNull();
  });

  it("only permits removal IDs already owned by the current gallery", () => {
    expect(getRequestedGalleryRemovalIds(["owned-a", "owned-b"], ["owned-b", "unrelated"])).toEqual(["owned-b"]);
    expect(getRequestedGalleryRemovalIds(null, ["unrelated"])).toEqual([]);
  });

  it("rejects private, loopback, link-local, mapped, and documentation addresses", () => {
    for (const address of ["127.0.0.1", "10.0.0.5", "169.254.169.254", "192.168.1.2", "::1", "fc00::1", "::ffff:127.0.0.1", "2001:db8::1", "2001:0db8::1"]) {
      expect(isPublicIpAddress(address), address).toBe(false);
    }
    expect(isPublicIpAddress("8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("2606:4700:4700::1111")).toBe(true);
  });

  it("pins public DNS answers and rejects a hostname with any private answer", async () => {
    const publicResult = await resolvePublicHost("MAIL.EXAMPLE.COM.", async () => [
      { address: "8.8.8.8", family: 4 }
    ]);
    expect(publicResult).toEqual({ hostname: "mail.example.com", address: "8.8.8.8", family: 4 });

    await expect(resolvePublicHost("mail.example.com", async () => [
      { address: "8.8.8.8", family: 4 },
      { address: "127.0.0.1", family: 4 }
    ])).rejects.toThrow("public IP");
  });

  it("uses proxy-overwritten identity instead of attacker-controlled first X-Forwarded-For", () => {
    const withRealIp = new Request("http://localhost", {
      headers: { "x-real-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4, 198.51.100.7" }
    });
    expect(getClientIp(withRealIp)).toBe("203.0.113.9");

    const forwardedOnly = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 8.8.8.8" }
    });
    expect(getClientIp(forwardedOnly)).toBe("8.8.8.8");
  });

  it("neutralizes spreadsheet formulas before CSV quoting", () => {
    expect(csvCell("=HYPERLINK(\"https://example.test\")")).toBe("\"'=HYPERLINK(\"\"https://example.test\"\")\"");
    expect(csvCell("  @SUM(1,1)")).toBe("\"'  @SUM(1,1)\"");
    expect(csvCell("Normal Company")).toBe("\"Normal Company\"");
  });

  it("rejects an oversized streamed body without Content-Length", async () => {
    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: new Blob(["0123456789abcdefghij"])
    });
    expect(request.headers.has("content-length")).toBe(false);

    const result = await readRequestWithBodyLimit(request, 0.00001, "Upload");
    expect("response" in result).toBe(true);
    if (!result.response) throw new Error("Expected an oversized response.");
    expect(result.response.status).toBe(413);
  });

  it("preserves a normal body after enforcing the stream limit", async () => {
    const request = new Request("http://localhost/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true })
    });
    const result = await readRequestWithBodyLimit(request, 1);
    expect("request" in result).toBe(true);
    if (!result.request) throw new Error("Expected a bounded request.");
    await expect(result.request.json()).resolves.toEqual({ ok: true });
  });
});
