import { AdminShell } from "@/components/admin/AdminShell";
import { RoleForm } from "@/components/admin/RoleForm";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function NewRolePage() {
  const [authorities, { t }] = await Promise.all([prisma.authority.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }), getServerTranslations()]);
  return <AdminShell requiredAuthority="roles.manage"><div className="admin-page-header"><h1>{t("admin.roles.new")}</h1></div><RoleForm authorities={authorities} /></AdminShell>;
}
