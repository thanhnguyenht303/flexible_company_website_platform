import Link from "next/link";
import {
  CircleHelp,
  ClipboardList,
  FileText,
  Inbox,
  MessageSquareText,
  Package,
  UserRoundCheck,
  UsersRound,
  Wrench
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { badgeTone, formatDate, statusLabel } from "@/modules/forms/forms.labels";

export const dynamic = "force-dynamic";

const statIcons = {
  products: Package,
  services: Wrench,
  posts: FileText,
  team: UsersRound,
  inquiries: Inbox,
  forms: ClipboardList,
  leads: UserRoundCheck,
  qa: CircleHelp
} as const;

type DashboardStat = {
  labelKey: string;
  total: number;
  publicCount: number | null;
  publicLabelKey: string;
  href: string;
  icon: keyof typeof statIcons;
};

type QaSnapshot = {
  total: number;
  fromForms: number;
  proposed: number;
  answered: number;
  published: number;
  recent: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    responseCount: number;
  }>;
};

function emptyStats(): DashboardStat[] {
  return [
    { labelKey: "admin.common.products", total: 0, publicCount: 0, publicLabelKey: "admin.common.published", href: "/admin/products", icon: "products" },
    { labelKey: "admin.common.services", total: 0, publicCount: 0, publicLabelKey: "admin.common.published", href: "/admin/services", icon: "services" },
    { labelKey: "admin.common.posts", total: 0, publicCount: 0, publicLabelKey: "admin.common.published", href: "/admin/posts", icon: "posts" },
    { labelKey: "admin.common.team", total: 0, publicCount: 0, publicLabelKey: "admin.common.visible", href: "/admin/team", icon: "team" },
    { labelKey: "admin.common.inquiries", total: 0, publicCount: null, publicLabelKey: "", href: "/admin/inquiries", icon: "inquiries" },
    { labelKey: "formsFeature.forms.title", total: 0, publicCount: 0, publicLabelKey: "admin.common.published", href: "/admin/forms", icon: "forms" },
    { labelKey: "formsFeature.leads.title", total: 0, publicCount: null, publicLabelKey: "", href: "/admin/leads", icon: "leads" },
    { labelKey: "formsFeature.qa.title", total: 0, publicCount: 0, publicLabelKey: "formsFeature.status.PUBLISHED", href: "/admin/qa", icon: "qa" }
  ];
}

function emptyQaSnapshot(): QaSnapshot {
  return {
    total: 0,
    fromForms: 0,
    proposed: 0,
    answered: 0,
    published: 0,
    recent: []
  };
}

async function getDashboardData(): Promise<{ stats: DashboardStat[]; qa: QaSnapshot }> {
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
      inquiries,
      forms,
      publishedForms,
      leads,
      qaTotal,
      qaFromForms,
      qaProposed,
      qaAnswered,
      qaPublished,
      recentQa
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.service.count(),
      prisma.service.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.teamMember.count(),
      prisma.teamMember.count({ where: { isVisible: true } }),
      prisma.inquiry.count(),
      prisma.form.count(),
      prisma.form.count({ where: { status: "PUBLISHED" } }),
      prisma.lead.count(),
      prisma.qaItem.count(),
      prisma.qaItem.count({ where: { OR: [{ sourceFormId: { not: null } }, { submissionId: { not: null } }] } }),
      prisma.qaItem.count({ where: { status: { in: ["NEW", "REVIEWING"] } } }),
      prisma.qaItem.count({ where: { NOT: [{ answer: null }, { answer: "" }] } }),
      prisma.qaItem.count({ where: { status: "PUBLISHED" } }),
      prisma.qaItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          answer: true,
          createdAt: true
        }
      })
    ]);

    return {
      stats: [
        { labelKey: "admin.common.products", total: products, publicCount: publishedProducts, publicLabelKey: "admin.common.published", href: "/admin/products", icon: "products" },
        { labelKey: "admin.common.services", total: services, publicCount: publishedServices, publicLabelKey: "admin.common.published", href: "/admin/services", icon: "services" },
        { labelKey: "admin.common.posts", total: posts, publicCount: publishedPosts, publicLabelKey: "admin.common.published", href: "/admin/posts", icon: "posts" },
        { labelKey: "admin.common.team", total: team, publicCount: visibleTeam, publicLabelKey: "admin.common.visible", href: "/admin/team", icon: "team" },
        { labelKey: "admin.common.inquiries", total: inquiries, publicCount: null, publicLabelKey: "", href: "/admin/inquiries", icon: "inquiries" },
        { labelKey: "formsFeature.forms.title", total: forms, publicCount: publishedForms, publicLabelKey: "admin.common.published", href: "/admin/forms", icon: "forms" },
        { labelKey: "formsFeature.leads.title", total: leads, publicCount: null, publicLabelKey: "", href: "/admin/leads", icon: "leads" },
        { labelKey: "formsFeature.qa.title", total: qaTotal, publicCount: qaPublished, publicLabelKey: "formsFeature.status.PUBLISHED", href: "/admin/qa", icon: "qa" }
      ],
      qa: {
        total: qaTotal,
        fromForms: qaFromForms,
        proposed: qaProposed,
        answered: qaAnswered,
        published: qaPublished,
        recent: recentQa.map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          createdAt: item.createdAt,
          responseCount: item.answer?.trim() ? 1 : 0
        }))
      }
    };
  } catch {
    return { stats: emptyStats(), qa: emptyQaSnapshot() };
  }
}

export default async function AdminDashboardPage() {
  const [{ stats, qa }, { language, t }] = await Promise.all([getDashboardData(), getServerTranslations()]);
  const answerRate = qa.total ? Math.round((qa.answered / qa.total) * 100) : 0;

  return (
    <AdminShell>
      <div className="dashboard-page">
        <section className="dashboard-hero" aria-labelledby="dashboard-title">
          <div>
            <p className="dashboard-eyebrow">{t("admin.dashboard.eyebrow")}</p>
            <h1 id="dashboard-title">{t("admin.common.dashboard")}</h1>
            <p>{t("admin.dashboard.subtitle")}</p>
          </div>
          <div className="dashboard-hero__actions">
            <Link className="button secondary" href="/admin/pages">
              {t("admin.common.editHomepage")}
            </Link>
            <Link className="button" href="/admin/qa">
              {t("admin.dashboard.openQa")}
            </Link>
          </div>
        </section>

        <section aria-labelledby="dashboard-content-title">
          <div className="dashboard-section-header">
            <div>
              <h2 id="dashboard-content-title">{t("admin.dashboard.contentHealth")}</h2>
              <p>{t("admin.dashboard.contentHealthText")}</p>
            </div>
          </div>
          <div className="dashboard-stat-grid">
            {stats.map((item) => {
              const Icon = statIcons[item.icon];

              return (
                <Link className="dashboard-stat-card" href={item.href} key={item.labelKey}>
                  <div className="dashboard-stat-card__top">
                    <span className="dashboard-stat-card__icon" aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    <span>{t(item.labelKey)}</span>
                  </div>
                  <strong>{item.total}</strong>
                  <span className="dashboard-stat-card__meta">
                    {item.publicCount !== null
                      ? t("admin.dashboard.publicCount", {
                          count: item.publicCount,
                          label: item.publicLabelKey ? t(item.publicLabelKey).toLowerCase() : ""
                        })
                      : t("admin.common.totalRecords")}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="dashboard-qa-panel" aria-labelledby="dashboard-qa-title">
          <div className="dashboard-qa-main">
            <div className="dashboard-section-header">
              <div>
                <h2 id="dashboard-qa-title">{t("admin.dashboard.qaWorkspace")}</h2>
                <p>{t("admin.dashboard.qaDescription")}</p>
              </div>
              <Link className="button secondary" href="/admin/forms">
                {t("admin.dashboard.viewForms")}
              </Link>
            </div>
            <div className="dashboard-qa-metrics">
              <div className="dashboard-qa-metric">
                <span>{t("admin.dashboard.totalQuestions")}</span>
                <strong>{qa.total}</strong>
              </div>
              <div className="dashboard-qa-metric">
                <span>{t("admin.dashboard.submittedQuestions")}</span>
                <strong>{qa.fromForms}</strong>
              </div>
              <div className="dashboard-qa-metric">
                <span>{t("admin.dashboard.proposedQuestions")}</span>
                <strong>{qa.proposed}</strong>
              </div>
              <div className="dashboard-qa-metric">
                <span>{t("admin.dashboard.responses")}</span>
                <strong>{qa.answered}</strong>
              </div>
            </div>
            <div className="dashboard-progress-card">
              <div className="dashboard-progress-card__copy">
                <span>{t("admin.dashboard.answerRate")}</span>
                <strong>{answerRate}%</strong>
              </div>
              <div className="dashboard-progress" aria-hidden="true">
                <span style={{ width: `${answerRate}%` }} />
              </div>
              <p>
                {t("admin.dashboard.publishedAnswers", { count: qa.published })} /{" "}
                {t("admin.dashboard.needsReview", { count: qa.proposed })}
              </p>
            </div>
          </div>

          <aside className="dashboard-qa-recent" aria-labelledby="dashboard-qa-recent-title">
            <div className="dashboard-qa-recent__header">
              <div>
                <p className="dashboard-eyebrow">{t("admin.dashboard.sourceForms")}</p>
                <h3 id="dashboard-qa-recent-title">{t("admin.dashboard.recentQuestions")}</h3>
              </div>
              <MessageSquareText size={22} aria-hidden="true" />
            </div>
            <div className="dashboard-qa-list">
              {qa.recent.map((item) => (
                <Link className="dashboard-qa-row" href={`/admin/qa/${item.id}`} key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{formatDate(item.createdAt, language)}</span>
                  </div>
                  <div className="dashboard-qa-row__meta">
                    <span className={`badge badge--${badgeTone(item.status)}`}>{statusLabel(language, item.status)}</span>
                    <span className="dashboard-response-pill">
                      {t("admin.dashboard.responseCount", { count: item.responseCount })}
                    </span>
                  </div>
                </Link>
              ))}
              {!qa.recent.length ? (
                <div className="empty-state">
                  <strong>{t("admin.dashboard.noRecentQa")}</strong>
                  <span>{t("formsFeature.qa.emptyText")}</span>
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      </div>
    </AdminShell>
  );
}
