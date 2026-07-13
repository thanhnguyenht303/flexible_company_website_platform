import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleDeleteButton } from "@/components/admin/RoleDeleteButton";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function RolesPage() {
  const [roles, { t, language }] = await Promise.all([
    prisma.role.findMany({ include: { _count: { select: { users: true, authorities: true } } }, orderBy: [{ isSystem: "desc" }, { name: "asc" }] }),
    getServerTranslations()
  ]);
  return <AdminShell requiredAuthority="roles.manage">
    <div className="admin-page-header"><div><h1>{t("admin.roles.title")}</h1><p className="message">{t("admin.roles.intro")}</p></div><Link className="button" href="/admin/roles/new">{t("admin.roles.new")}</Link></div>
    <div className="admin-panel"><div className="table-scroll"><table className="table"><thead><tr><th>{t("admin.roles.name")}</th><th>{t("admin.roles.slug")}</th><th>{t("admin.roles.authorities")}</th><th>{t("admin.roles.users")}</th><th>{t("admin.roles.created")}</th><th>{t("admin.common.actions")}</th></tr></thead><tbody>{roles.map((role) => <tr key={role.id}><td><strong>{role.name}</strong>{role.isSystem ? <span className="badge badge--neutral role-system-badge">{t("admin.roles.system")}</span> : null}<span className="table-secondary-line">{role.description}</span></td><td><code>{role.slug}</code></td><td>{role._count.authorities}</td><td>{role._count.users}</td><td>{new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(role.createdAt)}</td><td><div className="row-actions"><Link className="button secondary compact" href={`/admin/roles/${role.id}/edit`}>{role.isSystem ? t("admin.roles.view") : t("admin.common.edit")}</Link>{!role.isSystem ? <RoleDeleteButton id={role.id} name={role.name} /> : null}</div></td></tr>)}</tbody></table></div></div>
  </AdminShell>;
}
