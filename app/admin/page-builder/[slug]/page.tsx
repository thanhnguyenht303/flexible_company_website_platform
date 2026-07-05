import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { VisualPageBuilder } from "@/components/admin/VisualPageBuilder";
import { prisma } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";
import { getPublicSiteContext } from "@/lib/public-data";
import type { BuilderBlock } from "@/modules/page-builder/page-builder.types";
import { sectionsToBuilderBlocks } from "@/modules/page-builder/page-builder.utils";

async function getPage(slug: string) {
  const [page, draft] = await Promise.all([
    prisma.page.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    }),
    prisma.pageBuilderDraft.findUnique({ where: { pageSlug: slug } })
  ]);

  if (page) return { page, draft };
  if (slug !== "home") return null;

  const createdPage = await prisma.page.create({
    data: {
      title: "Home",
      slug: "home",
      status: "PUBLISHED",
      template: "visual-builder"
    },
    include: {
      sections: true
    }
  });
  return { page: createdPage, draft };
}

export default async function AdminPageBuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPage(slug);
  if (!result) notFound();
  const { page, draft } = result;
  const [{ team, services, posts, forms, qaItems }, { t }] = await Promise.all([getPublicSiteContext(), getServerTranslations()]);
  const dynamicContent = {
    team: team.map((member) => ({
      id: "id" in member ? member.id : null,
      name: member.name,
      position: member.position,
      positionVi: "positionVi" in member ? member.positionVi : null,
      bio: member.bio,
      bioVi: "bioVi" in member ? member.bioVi : null,
      photoId: "photoId" in member ? member.photoId : null
    })),
    services: services.map((service) => ({
      name: service.name,
      nameVi: "nameVi" in service ? service.nameVi : null,
      slug: service.slug,
      summary: service.summary,
      summaryVi: "summaryVi" in service ? service.summaryVi : null,
      imageId: "imageId" in service ? service.imageId : null
    })),
    posts: posts.map((post) => ({
      title: post.title,
      titleVi: "titleVi" in post ? post.titleVi : null,
      slug: post.slug,
      excerpt: post.excerpt,
      excerptVi: "excerptVi" in post ? post.excerptVi : null,
      content: post.content,
      contentVi: "contentVi" in post ? post.contentVi : null,
      featuredImageId: "featuredImageId" in post ? post.featuredImageId : null
    })),
    forms,
    qaItems: qaItems.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      question: item.question,
      answer: item.answer,
      category: item.category
    }))
  };
  const draftBlocks = Array.isArray(draft?.blocks) ? (draft.blocks as BuilderBlock[]) : null;
  const publishedBlocks = sectionsToBuilderBlocks(page.sections).filter(isCanvasBlock);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <div>
          <h1>{t("admin.common.visualPageBuilder")}</h1>
          <p className="message">{t("admin.common.edit")} {page.title}</p>
        </div>
        <Link className="button secondary" href="/admin/pages">
          {t("admin.common.back")}
        </Link>
      </div>
      <VisualPageBuilder
        page={{ title: page.title, slug: page.slug, status: page.status }}
        initialBlocks={draftBlocks ?? publishedBlocks}
        dynamicContent={dynamicContent}
        hasDraft={Boolean(draft)}
      />
    </AdminShell>
  );
}

function isCanvasBlock(block: BuilderBlock) {
  return typeof block.canvasX === "number" && typeof block.canvasY === "number" && typeof block.canvasWidth === "number";
}
