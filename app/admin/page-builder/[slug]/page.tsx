import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { VisualPageBuilder } from "@/components/admin/VisualPageBuilder";
import { prisma } from "@/lib/db";
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
  const { team, services, posts } = await getPublicSiteContext();
  const dynamicContent = {
    team: team.map((member) => ({
      id: "id" in member ? member.id : null,
      name: member.name,
      position: member.position,
      bio: member.bio,
      photoId: "photoId" in member ? member.photoId : null
    })),
    services: services.map((service) => ({
      name: service.name,
      slug: service.slug,
      summary: service.summary,
      imageId: "imageId" in service ? service.imageId : null
    })),
    posts: posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featuredImageId: "featuredImageId" in post ? post.featuredImageId : null
    }))
  };
  const draftBlocks = Array.isArray(draft?.blocks) ? (draft.blocks as BuilderBlock[]) : null;
  const publishedBlocks = sectionsToBuilderBlocks(page.sections).filter(isCanvasBlock);

  return (
    <AdminShell>
      <div className="admin-page-header">
        <div>
          <h1>Visual Page Builder</h1>
          <p className="message">Editing {page.title}</p>
        </div>
        <Link className="button secondary" href="/admin/pages">
          Back
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
