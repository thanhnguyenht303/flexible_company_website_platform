import { PublishStatus, type Form, type FormField } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { FormFieldOption, PublicForm, PublicFormField } from "@/modules/forms/forms.types";

export async function getPublicFormBySlug(slug: string) {
  const form = await prisma.form.findFirst({
    where: {
      slug,
      status: PublishStatus.PUBLISHED
    },
    include: {
      fields: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return form ? toPublicForm(form) : null;
}

export async function getPublishedFormsForPicker() {
  return prisma.form.findMany({
    where: { status: PublishStatus.PUBLISHED },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, sourceType: true }
  });
}

export function toPublicForm(form: Form & { fields: FormField[] }): PublicForm {
  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    description: form.description,
    successMessage: form.successMessage,
    redirectUrl: form.redirectUrl,
    sourceType: form.sourceType,
    linkedEntityType: form.linkedEntityType,
    linkedEntityId: form.linkedEntityId,
    fields: form.fields
      .filter((field) => field.type !== "hidden" || field.defaultValue)
      .map(toPublicField)
  };
}

function toPublicField(field: FormField): PublicFormField {
  return {
    id: field.id,
    type: field.type as PublicFormField["type"],
    label: field.label,
    key: field.key,
    helpText: field.helpText,
    placeholder: field.placeholder,
    required: field.required,
    options: normalizeOptions(field.options),
    defaultValue: field.defaultValue,
    sortOrder: field.sortOrder
  };
}

export function normalizeOptions(value: unknown): FormFieldOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { label: item, value: item };
      if (typeof item === "object" && item !== null) {
        const record = item as Record<string, unknown>;
        const label = typeof record.label === "string" ? record.label : "";
        const optionValue = typeof record.value === "string" ? record.value : label;
        if (label && optionValue) return { label, value: optionValue };
      }
      return null;
    })
    .filter((item): item is FormFieldOption => Boolean(item));
}
