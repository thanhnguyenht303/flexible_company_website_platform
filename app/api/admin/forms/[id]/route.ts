import { Prisma, PublishStatus } from "@prisma/client";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { formSchema, normalizeFormInput, updateFormSchema } from "@/modules/forms/forms.validation";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "forms.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const form = await prisma.form.findUnique({
    where: { id },
    include: { fields: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } }
  });
  if (!form) return fail("NOT_FOUND", "Form not found.", 404);

  return ok(form);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "forms.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.form.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Form not found.", 404);

  const parsed = updateFormSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const input = normalizeFormInput(parsed.data);
  if (input.fields) {
    const duplicateKey = findDuplicateFieldKey(input.fields);
    if (duplicateKey) return fail("DUPLICATE_FIELD_KEY", "Field keys must be unique.", 422, { fields: `Duplicate field key: ${duplicateKey}` });
  }

  if (input.slug && input.slug !== existing.slug) {
    const owner = await prisma.form.findUnique({ where: { slug: input.slug } });
    if (owner) return fail("SLUG_EXISTS", "A form with this slug already exists.", 409, { slug: "Slug must be unique." });
  }

  const form = await prisma.$transaction(async (tx) => {
    const updated = await tx.form.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.status !== undefined ? { status: input.status as PublishStatus } : {}),
        ...(input.successMessage !== undefined ? { successMessage: input.successMessage || null } : {}),
        ...(input.redirectUrl !== undefined ? { redirectUrl: input.redirectUrl || null } : {}),
        ...(input.notificationEmails !== undefined ? { notificationEmails: input.notificationEmails } : {}),
        ...(input.sourceType !== undefined ? { sourceType: input.sourceType } : {}),
        ...(input.linkedEntityType !== undefined ? { linkedEntityType: input.linkedEntityType || null } : {}),
        ...(input.linkedEntityId !== undefined ? { linkedEntityId: input.linkedEntityId || null } : {}),
        ...(input.settings !== undefined ? { settings: toJsonInput(input.settings) } : {})
      }
    });

    if (input.fields) {
      await tx.formField.deleteMany({ where: { formId: id } });
      if (input.fields.length) {
        await tx.formField.createMany({
          data: input.fields.map((field, index) => ({
            formId: id,
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
        });
      }
    }

    return tx.form.findUniqueOrThrow({
      where: { id: updated.id },
      include: { fields: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } }
    });
  });

  return ok(form);
}

function toJsonInput(value: unknown) {
  return value === undefined || value === null ? undefined : (value as Prisma.InputJsonValue);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "forms.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.form.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Form not found.", 404);

  await prisma.form.delete({ where: { id } });
  return ok({ deleted: true });
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
