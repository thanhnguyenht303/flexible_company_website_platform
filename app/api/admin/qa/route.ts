import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { normalizeQaInput, qaItemSchema } from "@/modules/forms/forms.validation";

export async function GET(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "qa.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status")?.trim();

  const items = await prisma.qaItem.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { question: { contains: q, mode: "insensitive" } },
              { answer: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  return ok(items);
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "qa.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const parsed = qaItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const input = normalizeQaInput(parsed.data);
  if (!input.slug) return fail("VALIDATION_ERROR", "Slug could not be generated.", 422);
  const slug = await getUniqueQaSlug(input.slug);

  const item = await prisma.qaItem.create({
    data: {
      title: input.title,
      slug,
      question: input.question,
      answer: input.answer || null,
      submitterName: input.submitterName || null,
      submitterEmail: input.submitterEmail || null,
      category: input.category || null,
      status: input.status,
      relatedType: input.relatedType || null,
      relatedId: input.relatedId || null,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null
    }
  });

  return ok(item, { status: 201 });
}

async function getUniqueQaSlug(base: string) {
  let slug = base;
  let suffix = 2;
  while (await prisma.qaItem.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}
