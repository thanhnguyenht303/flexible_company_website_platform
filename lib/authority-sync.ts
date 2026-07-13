import type { PrismaClient } from "@prisma/client";
import { ADMIN_MENU_AUTHORITIES, SUPER_ADMIN_NAME, SUPER_ADMIN_SLUG } from "../config/admin-authorities";
import { superAdminPermissions } from "./permissions";

export async function syncAuthorities(prisma: PrismaClient) {
  for (const authority of ADMIN_MENU_AUTHORITIES) {
    await prisma.authority.upsert({
      where: { key: authority.key },
      update: {
        name: authority.name,
        group: authority.group,
        description: authority.description,
        menuPath: authority.menuPath,
        isSystem: true
      },
      create: { ...authority, isSystem: true }
    });
  }

  const superAdminRole = await prisma.role.upsert({
    where: { name: SUPER_ADMIN_NAME },
    update: {
      slug: SUPER_ADMIN_SLUG,
      description: "Full access to all admin features",
      permissions: superAdminPermissions,
      isSystem: true
    },
    create: {
      name: SUPER_ADMIN_NAME,
      slug: SUPER_ADMIN_SLUG,
      description: "Full access to all admin features",
      permissions: superAdminPermissions,
      isSystem: true
    }
  });

  const authorities = await prisma.authority.findMany({ select: { id: true, key: true } });
  await prisma.roleAuthority.createMany({
    data: authorities.map(({ id }) => ({ roleId: superAdminRole.id, authorityId: id })),
    skipDuplicates: true
  });

  const roles = await prisma.role.findMany({ select: { id: true, permissions: true } });
  for (const role of roles) {
    const permissions = role.permissions as Record<string, unknown>;
    const permitted = authorities.filter(({ key }) =>
      permissions.all === true ||
      permissions[key] === true ||
      (key === "siteSettings.manage" && permissions["site.settings.update"] === true) ||
      (key === "theme.manage" && permissions["theme.update"] === true)
    );
    if (permitted.length > 0) {
      await prisma.roleAuthority.createMany({
        data: permitted.map(({ id }) => ({ roleId: role.id, authorityId: id })),
        skipDuplicates: true
      });
    }
  }

  return superAdminRole;
}
