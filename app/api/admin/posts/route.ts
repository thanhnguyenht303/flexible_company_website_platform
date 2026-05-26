import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
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

  const { fields, image } = await parsePostRequest(request);
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

    return {
      fields: {
        title: stringField(formData.get("title")),
        slug: stringField(formData.get("slug")),
        excerpt: stringField(formData.get("excerpt")),
        content: stringField(formData.get("content")),
        status: stringField(formData.get("status")) || "DRAFT"
      },
      image: imageValue instanceof File && imageValue.size > 0 ? imageValue : null
    };
  }

  return {
    fields: await request.json().catch(() => null),
    image: null
  };
}

function stringField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
