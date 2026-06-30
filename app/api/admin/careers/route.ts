import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { jobPostingSchema, normalizeJobPostingInput } from "@/modules/careers/careers.validation";

export async function GET() {
  const user = await requireAdminUser();
  if (!hasPermission(user, "careers.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const jobs = await prisma.jobPosting.findMany({ orderBy: [{ createdAt: "desc" }], take: 100 });
  return ok(jobs);
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "careers.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const parsed = jobPostingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const input = normalizeJobPostingInput(parsed.data);
  const existing = await prisma.jobPosting.findUnique({ where: { slug: input.slug } });
  if (existing) {
    return fail("SLUG_EXISTS", "A job posting with this slug already exists.", 409, {
      slug: "Slug must be unique."
    });
  }

  const job = await prisma.jobPosting.create({
    data: {
      title: input.title,
      slug: input.slug,
      summary: input.summary || null,
      description: input.description,
      requirements: input.requirements || null,
      department: input.department || null,
      location: input.location || null,
      employmentType: input.employmentType || null,
      workMode: input.workMode || null,
      salaryRange: input.salaryRange || null,
      applyEmail: input.applyEmail || null,
      applyUrl: input.applyUrl || null,
      status: input.status as PublishStatus,
      publishedAt: input.status === PublishStatus.PUBLISHED ? new Date() : null
    }
  });

  revalidateJobPaths(job.slug);
  return ok(job, { status: 201 });
}

function revalidateJobPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/careers");
  revalidatePath(`/careers/${slug}`);
  revalidatePath("/admin/careers");
}
