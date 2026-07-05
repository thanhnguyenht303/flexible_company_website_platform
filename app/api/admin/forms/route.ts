import { Prisma, PublishStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { formSchema, normalizeFormInput } from "@/modules/forms/forms.validation";

export async function GET() {
  const user = await requireAdminUser();
  if (!hasPermission(user, "forms.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { fields: true, submissions: true }
      }
    },
    take: 100
  });

  return ok(forms);
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "forms.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const parsed = formSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const input = normalizeFormInput(parsed.data);
  if (!input.slug) return fail("VALIDATION_ERROR", "Slug could not be generated.", 422);

  const existing = await prisma.form.findUnique({ where: { slug: input.slug } });
  if (existing) return fail("SLUG_EXISTS", "A form with this slug already exists.", 409, { slug: "Slug must be unique." });

  const duplicateKey = findDuplicateFieldKey(input.fields);
  if (duplicateKey) return fail("DUPLICATE_FIELD_KEY", "Field keys must be unique.", 422, { fields: `Duplicate field key: ${duplicateKey}` });

  const form = await prisma.form.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      status: input.status as PublishStatus,
      successMessage: input.successMessage || null,
      redirectUrl: input.redirectUrl || null,
      notificationEmails: input.notificationEmails,
      sourceType: input.sourceType,
      linkedEntityType: input.linkedEntityType || null,
      linkedEntityId: input.linkedEntityId || null,
      settings: toJsonInput(input.settings),
      fields: {
        create: input.fields.map((field, index) => ({
          type: field.type,
          label: field.label,
          key: field.key,
          helpText: field.helpText || null,
          placeholder: field.placeholder || null,
          required: field.required,
          options: toJsonInput(field.options),
          validation: toJsonInput(field.validation),
          defaultValue: field.defaultValue || null,
          internalLabel: field.internalLabel || null,
          sortOrder: field.sortOrder || index,
          settings: toJsonInput(field.settings)
        }))
      }
    },
    include: { fields: { orderBy: { sortOrder: "asc" } } }
  });

  return ok(form, { status: 201 });
}

function toJsonInput(value: unknown) {
  return value === undefined || value === null ? undefined : (value as Prisma.InputJsonValue);
}

function findDuplicateFieldKey(fields: Array<{ key: string }>) {
  const seen = new Set<string>();
  for (const field of fields) {
    const key = field.key.toLowerCase();
    if (seen.has(key)) return field.key;
    seen.add(key);
  }
  return null;
}
