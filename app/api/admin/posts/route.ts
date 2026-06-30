import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { blogPostSchema, normalizeBlogPostInput } from "@/modules/blog/blog.validation";

export async function GET() {
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const posts = await prisma.post.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100
  });

  return ok(posts);
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "posts.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Post upload");
  if (oversized) return oversized;

  const { fields, image, inlineImages } = await parsePostRequest(request);
  const parsed = blogPostSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  const input = normalizeBlogPostInput(parsed.data);
  const existing = await prisma.post.findUnique({ where: { slug: input.slug } });

  if (existing) {
    return fail("SLUG_EXISTS", "A post with this slug already exists.", 409, {
      slug: "Slug must be unique."
    });
  }

  let post = await prisma.post.create({
    data: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt || null,
      content: input.content,
      status: input.status as PublishStatus,
      tagNames: [],
      publishedAt: input.status === PublishStatus.PUBLISHED ? new Date() : null
    }
  });

  const contentWithInlineImages = await saveInlinePostImages(post.id, post.title, post.content, inlineImages, user.id);
  if (contentWithInlineImages !== post.content) {
    post = await prisma.post.update({
      where: { id: post.id },
      data: { content: contentWithInlineImages }
    });
  }

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
        data: {
          featuredImageId: asset.id
        }
      });

      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { url: `/api/media/${asset.id}` }
      });
    }
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin/posts");
  revalidatePath("/");

  return ok(post, { status: 201 });
}

async function parsePostRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const imageValue = formData.get("featuredImage");
    const inlineFiles = formData
      .getAll("inlineImages")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const inlineTokens = formData
      .getAll("inlineImageTokens")
      .filter((value): value is string => typeof value === "string");
    const inlineAltTexts = formData
      .getAll("inlineImageAltTexts")
      .filter((value): value is string => typeof value === "string");

    return {
      fields: {
        title: stringField(formData.get("title")),
        slug: stringField(formData.get("slug")),
        excerpt: stringField(formData.get("excerpt")),
        content: stringField(formData.get("content")),
        status: stringField(formData.get("status")) || "DRAFT"
      },
      image: imageValue instanceof File && imageValue.size > 0 ? imageValue : null,
      inlineImages: inlineFiles.map((file, index) => ({
        file,
        token: inlineTokens[index] ?? "",
        altText: inlineAltTexts[index] || "Article image"
      }))
    };
  }

  return {
    fields: await request.json().catch(() => null),
    image: null,
    inlineImages: []
  };
}

function stringField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

async function saveInlinePostImages(
  postId: string,
  postTitle: string,
  content: string,
  inlineImages: Array<{ file: File; token: string; altText: string }>,
  userId: string
) {
  let nextContent = content;

  for (const inlineImage of inlineImages) {
    if (!inlineImage.token || !nextContent.includes(`post-image:${inlineImage.token}`)) continue;

    const savedImage = await saveEntityImage({
      entityType: "posts",
      entityId: postId,
      file: inlineImage.file
    });
    if (!savedImage) continue;

    const asset = await prisma.mediaAsset.create({
      data: {
        filename: savedImage.relativePath,
        originalName: savedImage.originalName,
        mimeType: savedImage.mimeType,
        sizeBytes: savedImage.sizeBytes,
        url: "/api/media/pending",
        altText: inlineImage.altText || postTitle,
        uploadedById: userId
      }
    });

    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { url: `/api/media/${asset.id}` }
    });

    nextContent = nextContent.replaceAll(`post-image:${inlineImage.token}`, `/api/media/${asset.id}`);
  }

  return nextContent;
}
