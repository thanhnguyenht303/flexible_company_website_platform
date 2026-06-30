import { revalidatePath } from "next/cache";
import { PublishStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { serviceReviewSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rateLimit = checkRateLimit({
    key: `public:review:${getClientIp(request)}:${slug}`,
    limit: 3,
    windowMs: 5 * 60_000
  });
  if (!rateLimit.allowed) {
    return fail("RATE_LIMITED", `Too many reviews. Try again in ${rateLimit.retryAfterSeconds} seconds.`, 429);
  }

  const body = await request.json().catch(() => null);
  if (isHoneypotFilled(body)) {
    return fail("VALIDATION_ERROR", "Please check the submitted data.", 422);
  }

  const parsed = serviceReviewSchema.safeParse(body);
  if (!parsed.success) return validationFail(parsed.error);

  const service = await prisma.service.findFirst({
    where: {
      slug,
      status: PublishStatus.PUBLISHED
    },
    select: { id: true, slug: true }
  });

  if (!service) return fail("NOT_FOUND", "Service not found.", 404);

  const review = await prisma.serviceReview.create({
    data: {
      serviceId: service.id,
      name: parsed.data.name,
      email: parsed.data.email,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      isVisible: false
    },
    select: {
      id: true,
      name: true,
      rating: true,
      comment: true,
      createdAt: true
    }
  });

  revalidatePath(`/services/${service.slug}`);
  return ok(review, { status: 201 });
}

function isHoneypotFilled(value: unknown) {
  return (
    typeof value === "object" &&
    value !== null &&
    "website" in value &&
    typeof (value as { website?: unknown }).website === "string" &&
    (value as { website: string }).website.trim().length > 0
  );
}
