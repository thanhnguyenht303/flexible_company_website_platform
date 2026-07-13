import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleForm } from "@/components/admin/RoleForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [role, authorities, { t }] = await Promise.all([
    prisma.role.findUnique({ where: { id }, include: { authorities: { include: { authority: true } } } }),
    prisma.authority.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    getServerTranslations()
  ]);
  if (!role) notFound();
  return <AdminShell requiredAuthority="roles.manage"><div className="admin-page-header"><h1>{t("admin.roles.edit")}</h1></div><RoleForm authorities={authorities} role={{ id: role.id, name: role.name, slug: role.slug, description: role.description, isSystem: role.isSystem, authorityKeys: role.authorities.map(({ authority }) => authority.key) }} /></AdminShell>;
}
