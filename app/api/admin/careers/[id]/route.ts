import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteFileFolder, deleteStoredFile } from "@/lib/file-storage";
import { hasPermission } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import { jobPostingSchema } from "@/modules/careers/careers.validation";

const updateJobPostingSchema = jobPostingSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required."
});

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "careers.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const job = await prisma.jobPosting.findUnique({ where: { id } });
  if (!job) return fail("NOT_FOUND", "Job posting not found.", 404);

  return ok(job);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "careers.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.jobPosting.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Job posting not found.", 404);

  const parsed = updateJobPostingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const input = parsed.data;
  const nextSlug =
    input.slug && input.slug.trim().length > 0
      ? slugify(input.slug)
      : input.title
        ? slugify(input.title)
        : undefined;

  if (nextSlug && nextSlug !== existing.slug) {
    const slugOwner = await prisma.jobPosting.findUnique({ where: { slug: nextSlug } });
    if (slugOwner) {
      return fail("SLUG_EXISTS", "A job posting with this slug already exists.", 409, {
        slug: "Slug must be unique."
      });
    }
  }

  const nextStatus = input.status ?? existing.status;
  const shouldSetPublishedAt = nextStatus === PublishStatus.PUBLISHED && !existing.publishedAt;
  const shouldClearPublishedAt = nextStatus !== PublishStatus.PUBLISHED;

  const job = await prisma.jobPosting.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.summary !== undefined ? { summary: input.summary || null } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.requirements !== undefined ? { requirements: input.requirements || null } : {}),
      ...(input.department !== undefined ? { department: input.department || null } : {}),
      ...(input.location !== undefined ? { location: input.location || null } : {}),
      ...(input.employmentType !== undefined ? { employmentType: input.employmentType || null } : {}),
      ...(input.workMode !== undefined ? { workMode: input.workMode || null } : {}),
      ...(input.salaryRange !== undefined ? { salaryRange: input.salaryRange || null } : {}),
      ...(input.applyEmail !== undefined ? { applyEmail: input.applyEmail || null } : {}),
      ...(input.applyUrl !== undefined ? { applyUrl: input.applyUrl || null } : {}),
      ...(input.status !== undefined ? { status: input.status as PublishStatus } : {}),
      ...(shouldSetPublishedAt ? { publishedAt: new Date() } : {}),
      ...(shouldClearPublishedAt ? { publishedAt: null } : {})
    }
  });

  revalidateJobPaths(existing.slug);
  revalidateJobPaths(job.slug);
  return ok(job);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "careers.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          resumeFile: true
        }
      }
    }
  });
  if (!existing) return fail("NOT_FOUND", "Job posting not found.", 404);

  const fileAssetIds = existing.applications.flatMap((application) =>
    application.resumeFile ? [application.resumeFile.id] : []
  );

  await Promise.all(
    existing.applications.map(async (application) => {
      if (application.resumeFile) {
        await deleteStoredFile(application.resumeFile.filename).catch(() => null);
      }
      await deleteFileFolder("job-applications", application.id).catch(() => null);
    })
  );

  await prisma.jobPosting.delete({ where: { id } });
  if (fileAssetIds.length > 0) {
    await prisma.fileAsset.deleteMany({ where: { id: { in: fileAssetIds } } });
  }

  revalidateJobPaths(existing.slug);
  return ok({ deleted: true });
}

function revalidateJobPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/careers");
  revalidatePath(`/careers/${slug}`);
  revalidatePath("/admin/careers");
}
