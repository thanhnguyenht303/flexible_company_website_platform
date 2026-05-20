export type Permission =
  | "site.settings.update"
  | "theme.update"
  | "users.manage"
  | "products.manage"
  | "services.manage"
  | "posts.manage"
  | "team.manage"
  | "media.manage"
  | "inquiries.manage"
  | "audit.view";

type PermissionBag = Partial<Record<Permission, boolean>> & { all?: boolean };

export function hasPermission(
  user: { role?: { permissions?: unknown } } | null | undefined,
  permission: Permission
): boolean {
  if (!user?.role) return false;
  const permissions = user.role.permissions as PermissionBag | null | undefined;
  if (permissions?.all === true) return true;
  return Boolean(permissions?.[permission]);
}

export const superAdminPermissions: PermissionBag = { all: true };
