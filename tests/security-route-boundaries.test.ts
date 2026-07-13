import { readFileSync } from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
  requireEmailAdmin: vi.fn(),
  findFile: vi.fn(),
  readFile: vi.fn(),
  findTemplate: vi.fn(),
  sendEmail: vi.fn(),
  updateApplication: vi.fn()
}));

vi.mock("fs/promises", () => ({ readFile: mocks.readFile }));
vi.mock("@/lib/api-response", async () => import("../lib/api-response"));
vi.mock("@/lib/auth", () => ({ requireAdminUser: mocks.requireAdminUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    fileAsset: { findUnique: mocks.findFile },
    emailTemplate: { findFirst: mocks.findTemplate },
    jobApplication: { updateMany: mocks.updateApplication }
  }
}));
vi.mock("@/lib/file-storage", () => ({ resolveFilePath: (filename: string) => filename }));
vi.mock("@/lib/permissions", async () => import("../lib/permissions"));
vi.mock("@/lib/private-file-policy", async () => import("../lib/private-file-policy"));
vi.mock("@/modules/email/email.admin", () => ({ requireEmailAdmin: mocks.requireEmailAdmin }));
vi.mock("@/modules/email/email.validation", async () => import("../modules/email/email.validation"));
vi.mock("@/modules/email/email.service", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/modules/email/email.variables", async () => import("../modules/email/email.variables"));

import { GET as downloadPrivateFile } from "../app/api/admin/files/[id]/route";
import { POST as sendAdminEmail } from "../app/api/admin/email/send/route";

function adminWith(...authorityKeys: string[]) {
  return {
    id: "admin-user",
    role: {
      name: "Scoped Admin",
      slug: "scoped-admin",
      permissions: {},
      authorities: authorityKeys.map((key) => ({ authority: { key } }))
    }
  };
}

describe("security-sensitive route boundaries", () => {
  beforeEach(() => vi.resetAllMocks());

  it("does not let a forms admin download a careers resume", async () => {
    mocks.requireAdminUser.mockResolvedValue(adminWith("forms.manage"));
    mocks.findFile.mockResolvedValue({
      id: "resume",
      filename: "job-applications/a/resume.pdf",
      originalName: "resume.pdf",
      mimeType: "application/pdf",
      sizeBytes: 10,
      category: "job-application-resume"
    });

    const response = await downloadPrivateFile(new Request("http://localhost/api/admin/files/resume"), {
      params: Promise.resolve({ id: "resume" })
    });

    expect(response.status).toBe(403);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("preserves downloads for an admin with the category authority", async () => {
    mocks.requireAdminUser.mockResolvedValue(adminWith("careers.manage"));
    mocks.findFile.mockResolvedValue({
      id: "resume",
      filename: "job-applications/a/resume.pdf",
      originalName: "resume.pdf",
      mimeType: "application/pdf",
      sizeBytes: 3,
      category: "job-application-resume"
    });
    mocks.readFile.mockResolvedValue(Buffer.from("pdf"));

    const response = await downloadPrivateFile(new Request("http://localhost/api/admin/files/resume"), {
      params: Promise.resolve({ id: "resume" })
    });

    expect(response.status).toBe(200);
    expect(mocks.readFile).toHaveBeenCalledOnce();
  });

  it("blocks application status transitions without careers authority", async () => {
    mocks.requireEmailAdmin.mockResolvedValue({ user: adminWith("email.manage"), error: null });
    const response = await sendAdminEmail(new Request("http://localhost/api/admin/email/send", {
      method: "POST",
      body: JSON.stringify({
        to: ["applicant@example.com"],
        subject: "Application update",
        body: "Update",
        relatedType: "jobApplication",
        relatedId: "application-id",
        statusAction: "INTERVIEW"
      })
    }));

    expect(response.status).toBe(403);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.updateApplication).not.toHaveBeenCalled();
  });

  it("preserves application transitions for admins with both authorities", async () => {
    mocks.requireEmailAdmin.mockResolvedValue({ user: adminWith("email.manage", "careers.manage"), error: null });
    mocks.sendEmail.mockResolvedValue({ id: "message", status: "SENT" });
    mocks.updateApplication.mockResolvedValue({ count: 1 });
    const response = await sendAdminEmail(new Request("http://localhost/api/admin/email/send", {
      method: "POST",
      body: JSON.stringify({
        to: ["applicant@example.com"],
        subject: "Application update",
        body: "Update",
        relatedType: "jobApplication",
        relatedId: "application-id",
        statusAction: "INTERVIEW"
      })
    }));

    expect(response.status).toBe(200);
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    expect(mocks.updateApplication).toHaveBeenCalledWith({
      where: { id: "application-id" },
      data: { status: "INTERVIEW" }
    });
  });

  it("authorizes server pages before their database side effects", () => {
    const emailPage = readFileSync("app/admin/email/messages/[id]/page.tsx", "utf8");
    expect(emailPage.indexOf('await requireAdminAuthority("email.manage")')).toBeLessThan(
      emailPage.indexOf("prisma.emailMessage.findUnique")
    );

    const builderPage = readFileSync("app/admin/page-builder/[slug]/page.tsx", "utf8");
    expect(builderPage.indexOf('await requireAdminAuthority("pages.manage")')).toBeLessThan(
      builderPage.indexOf("await getPage(slug)")
    );
  });
});
