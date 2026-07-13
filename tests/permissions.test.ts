import { describe, expect, it } from "vitest";
import { ALL_AUTHORITY_KEYS } from "../config/admin-authorities";
import {
  canAssignRole,
  canDelegateAuthorityKeys,
  getGrantedAuthorityKeys,
  hasAllAuthorities,
  hasAnyAuthority,
  hasAuthority,
  hasPermission
} from "../lib/permissions";

describe("admin authorities", () => {
  it("always grants every authority to Super Admin by slug", () => {
    const user = { role: { name: "Renamed System Admin", slug: "super-admin", permissions: {}, authorities: [] } };
    expect(hasAllAuthorities(user, [...ALL_AUTHORITY_KEYS])).toBe(true);
    expect(getGrantedAuthorityKeys(user)).toEqual(ALL_AUTHORITY_KEYS);
  });

  it("grants only normalized role authorities", () => {
    const user = {
      role: {
        name: "Catalog Editor",
        slug: "catalog-editor",
        permissions: {},
        authorities: [{ authority: { key: "products.manage" } }]
      }
    };
    expect(hasAuthority(user, "products.manage")).toBe(true);
    expect(hasAuthority(user, "users.manage")).toBe(false);
    expect(hasAnyAuthority(user, ["users.manage", "products.manage"])).toBe(true);
  });

  it("keeps legacy JSON permissions working during migration", () => {
    const user = { role: { name: "Legacy Editor", slug: "legacy-editor", permissions: { "site.settings.update": true } } };
    expect(hasPermission(user, "site.settings.update")).toBe(true);
    expect(hasAuthority(user, "siteSettings.manage")).toBe(true);
    expect(hasAuthority(user, "theme.manage")).toBe(false);
  });

  it("denies users without a role", () => {
    expect(hasAuthority(null, "dashboard.view")).toBe(false);
    expect(hasAuthority({}, "dashboard.view")).toBe(false);
  });

  it("prevents role managers from delegating authorities they do not have", () => {
    const roleManager = {
      role: {
        name: "Role Manager",
        slug: "role-manager",
        permissions: {},
        authorities: [{ authority: { key: "roles.manage" } }]
      }
    };

    expect(canDelegateAuthorityKeys(roleManager, ["roles.manage"])).toBe(true);
    expect(canDelegateAuthorityKeys(roleManager, ["roles.manage", "users.manage"])).toBe(false);
    expect(canDelegateAuthorityKeys(roleManager, ["unknown.manage"])).toBe(false);
  });

  it("prevents user managers from assigning a more privileged role", () => {
    const userManager = {
      role: {
        name: "User Manager",
        slug: "user-manager",
        permissions: {},
        authorities: [
          { authority: { key: "users.manage" } },
          { authority: { key: "products.manage" } }
        ]
      }
    };
    const peerRole = {
      name: "Catalog Manager",
      slug: "catalog-manager",
      permissions: {},
      authorities: [{ authority: { key: "products.manage" } }]
    };
    const elevatedRole = {
      name: "Role Manager",
      slug: "role-manager",
      permissions: {},
      authorities: [{ authority: { key: "roles.manage" } }]
    };
    const superAdminRole = {
      name: "Super Admin",
      slug: "super-admin",
      permissions: { all: true },
      authorities: []
    };

    expect(canAssignRole(userManager, peerRole)).toBe(true);
    expect(canAssignRole(userManager, elevatedRole)).toBe(false);
    expect(canAssignRole(userManager, superAdminRole)).toBe(false);
    expect(canAssignRole({ role: superAdminRole }, superAdminRole)).toBe(true);
  });
});
