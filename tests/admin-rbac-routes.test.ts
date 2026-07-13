import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdminUser: vi.fn(),
  findAuthorities: vi.fn(),
  createRole: vi.fn(),
  findRole: vi.fn(),
  createUser: vi.fn()
}));

vi.mock("@/lib/auth", () => ({ getAdminUser: mocks.getAdminUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    authority: { findMany: mocks.findAuthorities },
    role: { create: mocks.createRole, findUnique: mocks.findRole },
    user: { create: mocks.createUser }
  }
}));
vi.mock("@/lib/api-response", async () => import("../lib/api-response"));
vi.mock("@/lib/admin-rbac-validation", async () => import("../lib/admin-rbac-validation"));
vi.mock("@/lib/permissions", async () => import("../lib/permissions"));

import { POST as createRole } from "../app/api/admin/roles/route";
import { POST as createUser } from "../app/api/admin/users/route";

const roleManager = {
  id: "role-manager-user",
  role: {
    name: "Role Manager",
    slug: "role-manager",
    permissions: {},
    authorities: [{ authority: { key: "roles.manage" } }]
  }
};

const userManager = {
  id: "user-manager-user",
  role: {
    name: "User Manager",
    slug: "user-manager",
    permissions: {},
    authorities: [{ authority: { key: "users.manage" } }]
  }
};

describe("admin RBAC mutation routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects minting an authority the role manager does not have", async () => {
    mocks.getAdminUser.mockResolvedValue(roleManager);
    mocks.findAuthorities.mockResolvedValue([
      { id: "roles", key: "roles.manage" },
      { id: "users", key: "users.manage" }
    ]);

    const response = (await createRole(new Request("http://localhost/api/admin/roles", {
      method: "POST",
      body: JSON.stringify({
        name: "Escalated Role",
        slug: "escalated-role",
        authorityKeys: ["roles.manage", "users.manage"]
      })
    })))!;

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "AUTHORITY_ESCALATION_FORBIDDEN" }
    });
    expect(mocks.createRole).not.toHaveBeenCalled();
  });

  it("rejects assigning Super Admin by a non-Super-Admin user manager", async () => {
    mocks.getAdminUser.mockResolvedValue(userManager);
    mocks.findRole.mockResolvedValue({
      id: "super-admin-role",
      name: "Super Admin",
      slug: "super-admin",
      permissions: { all: true },
      authorities: []
    });

    const response = (await createUser(new Request("http://localhost/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        username: "escalated-user",
        password: "correct-horse-battery-staple",
        roleId: "super-admin-role"
      })
    })))!;

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ROLE_ESCALATION_FORBIDDEN" }
    });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
});
