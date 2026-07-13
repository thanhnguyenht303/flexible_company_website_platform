import type { AuthorityKey } from "../config/admin-authorities";
import { ALL_AUTHORITY_KEYS, SUPER_ADMIN_NAME, SUPER_ADMIN_SLUG } from "../config/admin-authorities";

export type Permission =
  | AuthorityKey
  | "site.settings.update"
  | "theme.update"
  | "audit.view";

type PermissionBag = Partial<Record<Permission, boolean>> & { all?: boolean };

type AuthorityRole = {
  name?: string | null;
  slug?: string | null;
  permissions?: unknown;
  authorities?: Array<{ authority: { key: string } }>;
};

type AuthorityUser = {
  role?: {
    name?: string | null;
    slug?: string | null;
    permissions?: unknown;
    authorities?: Array<{ authority: { key: string } }>;
  } | null;
} | null | undefined;

const legacyPermissionAliases: Partial<Record<Permission, AuthorityKey>> = {
  "site.settings.update": "siteSettings.manage",
  "theme.update": "theme.manage"
};
const authorityKeySet = new Set<string>(ALL_AUTHORITY_KEYS);

export function isSuperAdminRole(role: AuthorityRole) {
  return role.slug?.toLowerCase() === SUPER_ADMIN_SLUG || role.name?.toLowerCase() === SUPER_ADMIN_NAME.toLowerCase();
}

export function hasAuthority(user: AuthorityUser, authorityKey: AuthorityKey): boolean {
  if (!user?.role) return false;
  if (isSuperAdminRole(user.role)) return true;

  if (user.role.authorities?.some(({ authority }) => authority.key === authorityKey)) return true;

  const permissions = user.role.permissions as PermissionBag | null | undefined;
  if (permissions?.all === true || permissions?.[authorityKey] === true) return true;

  return Object.entries(legacyPermissionAliases).some(
    ([legacyKey, currentKey]) => currentKey === authorityKey && permissions?.[legacyKey as Permission] === true
  );
}

export function hasPermission(user: AuthorityUser, permission: Permission): boolean {
  const authorityKey = (legacyPermissionAliases[permission] ?? permission) as AuthorityKey | "audit.view";
  if (authorityKey === "audit.view") {
    if (!user?.role) return false;
    if (isSuperAdminRole(user.role)) return true;
    return Boolean((user.role.permissions as PermissionBag | undefined)?.[permission]);
  }
  return hasAuthority(user, authorityKey);
}

export function hasAnyAuthority(user: AuthorityUser, authorityKeys: AuthorityKey[]) {
  return authorityKeys.some((key) => hasAuthority(user, key));
}

export function hasAllAuthorities(user: AuthorityUser, authorityKeys: AuthorityKey[]) {
  return authorityKeys.every((key) => hasAuthority(user, key));
}

export function getGrantedAuthorityKeys(user: AuthorityUser): AuthorityKey[] {
  return ALL_AUTHORITY_KEYS.filter((key) => hasAuthority(user, key));
}

export function canDelegateAuthorityKeys(user: AuthorityUser, authorityKeys: readonly string[]) {
  return authorityKeys.every(
    (key) => authorityKeySet.has(key) && hasAuthority(user, key as AuthorityKey)
  );
}

export function canAssignRole(user: AuthorityUser, role: AuthorityRole) {
  if (!user?.role) return false;
  if (isSuperAdminRole(user.role)) return true;
  if (isSuperAdminRole(role)) return false;

  const targetUser = { role };
  return ALL_AUTHORITY_KEYS.every(
    (key) => !hasAuthority(targetUser, key) || hasAuthority(user, key)
  );
}

export const superAdminPermissions: PermissionBag = { all: true };
