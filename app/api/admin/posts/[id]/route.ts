import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteEntityImageFolder, saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { slugify } from "@/lib/slug";

const updatePostSchema = z
  .object({
    title: z.string().min(2).max(180).optional(),
    slug: z.string().max(220).optional(),
    excerpt: z.string().max(320).optional().nullable(),
    content: z.string().min(20).optional(),
    status: z.nativeEnum(PublishStatus).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required."
  });

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return fail("NOT_FOUND", "Post not found.", 404);

  return ok(post);
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) return fail("NOT_FOUND", "Post not found.", 404);

  const { fields, image } = await parsePostRequest(request);
  const parsed = updatePostSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const input = parsed.data;
  const nextSlug =
    input.slug && input.slug.trim().length > 0
      ? slugify(input.slug)
      : input.title
        ? slugify(input.title)
        : undefined;

  if (nextSlug && nextSlug !== existing.slug) {
    const slugOwner = await prisma.post.findUnique({ where: { slug: nextSlug } });
    if (slugOwner) {
      return fail("SLUG_EXISTS", "A post with this slug already exists.", 409, {
        slug: "Slug must be unique."
      });
    }
  }

  const nextStatus = input.status ?? existing.status;
  const shouldSetPublishedAt = nextStatus === PublishStatus.PUBLISHED && !existing.publishedAt;
  const shouldClearPublishedAt = nextStatus !== PublishStatus.PUBLISHED;

  let post = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt || null } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(shouldSetPublishedAt ? { publishedAt: new Date() } : {}),
      ...(shouldClearPublishedAt ? { publishedAt: null } : {})
    }
  });

  if (image) {
    const savedImage = await saveEntityImage({ entityType: "posts", entityId: post.id, file: image });
    if (savedImage) {
      const asset = await prisma.mediaAsset.create({
        data: {
          filename: savedImage.relativePath,
          originalName: savedImage.originalName,
          mimeType: savedImage.mimeType,
          sizeBytes: savedImage.sizeBytes,
          url: `/api/media/pending`,
          altText: post.title,
          uploadedById: user.id
        }
      });

      post = await prisma.post.update({
        where: { id: post.id },
        data: { featuredImageId: asset.id }
      });

      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { url: `/api/media/${asset.id}` }
      });
    }
  }

  revalidatePostPaths(existing.slug);
  revalidatePostPaths(post.slug);

  return ok(post);
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) return fail("NOT_FOUND", "Post not found.", 404);

  await prisma.post.delete({ where: { id: params.id } });
  await prisma.mediaAsset.deleteMany({
    where: {
      filename: {
        startsWith: `posts/${params.id}/`
      }
    }
  });
  await deleteEntityImageFolder("posts", params.id);
  revalidatePostPaths(existing.slug);

  return ok({ deleted: true });
}

function revalidatePostPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/posts");
}

async function parsePostRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const imageValue = formData.get("featuredImage");
    const fields: Record<string, string> = {};

    for (const field of ["title", "slug", "excerpt", "content", "status"]) {
      const value = formData.get(field);
      if (typeof value === "string") {
        fields[field] = value;
      }
    }

    return {
      fields,
      image: imageValue instanceof File && imageValue.size > 0 ? imageValue : null
    };
  }

  return {
    fields: await request.json().catch(() => null),
    image: null
  };
}
