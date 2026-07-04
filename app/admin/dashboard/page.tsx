import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

async function getCounts() {
  try {
    const [
      products,
      publishedProducts,
      services,
      publishedServices,
      posts,
      publishedPosts,
      team,
      visibleTeam,
      inquiries
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.service.count(),
      prisma.service.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.teamMember.count(),
      prisma.teamMember.count({ where: { isVisible: true } }),
      prisma.inquiry.count()
    ]);
    return [
      { labelKey: "admin.common.products", total: products, publicCount: publishedProducts, publicLabelKey: "admin.common.published" },
      { labelKey: "admin.common.services", total: services, publicCount: publishedServices, publicLabelKey: "admin.common.published" },
      { labelKey: "admin.common.posts", total: posts, publicCount: publishedPosts, publicLabelKey: "admin.common.published" },
      { labelKey: "admin.common.team", total: team, publicCount: visibleTeam, publicLabelKey: "admin.common.visible" },
      { labelKey: "admin.common.inquiries", total: inquiries, publicCount: null, publicLabelKey: "" }
    ];
  } catch {
    return [
      { labelKey: "admin.common.products", total: 0, publicCount: 0, publicLabelKey: "admin.common.published" },
      { labelKey: "admin.common.services", total: 0, publicCount: 0, publicLabelKey: "admin.common.published" },
      { labelKey: "admin.common.posts", total: 0, publicCount: 0, publicLabelKey: "admin.common.published" },
      { labelKey: "admin.common.team", total: 0, publicCount: 0, publicLabelKey: "admin.common.visible" },
      { labelKey: "admin.common.inquiries", total: 0, publicCount: null, publicLabelKey: "" }
    ];
  }
}

export default async function AdminDashboardPage() {
  const [counts, { t }] = await Promise.all([getCounts(), getServerTranslations()]);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>{t("admin.common.dashboard")}</h1>
      </div>
      <div className="admin-grid">
        {counts.map((item) => (
          <div className="admin-panel" key={item.labelKey}>
            <h2>{t(item.labelKey)}</h2>
            <div className="stat">
              <strong>{item.total}</strong>
              <span>{t("admin.common.totalRecords")}</span>
            </div>
            {item.publicCount !== null ? (
              <p className="message">
                {t("admin.dashboard.publicCount", {
                  count: item.publicCount,
                  label: item.publicLabelKey ? t(item.publicLabelKey).toLowerCase() : ""
                })}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
