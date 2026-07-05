import { PublishStatus } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { savePrivateUploadFile } from "@/lib/file-storage";
import { sendFormNotification } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { rejectOversizedRequest } from "@/lib/request-size";
import { isSafePublicUrl } from "@/lib/safe-url";
import { slugify } from "@/lib/slug";
import { normalizeOptions } from "@/modules/forms/forms.service";
import type { FormFieldType } from "@/modules/forms/forms.types";

const allowedFormFileTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await prisma.form.findUnique({
    where: { slug },
    include: { fields: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } }
  });

  if (!form || form.status !== PublishStatus.PUBLISHED) return fail("NOT_FOUND", "Form is not available.", 404);

  const rateLimit = checkRateLimit({
    key: `public:form:${getClientIp(request)}:${form.id}`,
    limit: 5,
    windowMs: 10 * 60_000
  });
  if (!rateLimit.allowed) {
    return fail("RATE_LIMITED", `Too many submissions. Try again in ${rateLimit.retryAfterSeconds} seconds.`, 429);
  }

  const oversized = rejectOversizedRequest(request, Math.max(env.MAX_FILE_UPLOAD_MB, env.MAX_UPLOAD_MB), "Form submission");
  if (oversized) return oversized;

  const contentType = request.headers.get("content-type") ?? "";
  const formData = contentType.includes("multipart/form-data")
    ? await request.formData()
    : jsonToFormData(await request.json().catch(() => null));

  if (stringField(formData.get("website")).trim()) {
    return fail("VALIDATION_ERROR", "Please check the submitted data.", 422);
  }

  const sourceType = stringField(formData.get("_sourceType")) || form.sourceType;
  const sourceId = stringField(formData.get("_sourceId")) || form.linkedEntityId || null;
  const validation = validateSubmission(form.fields, formData);
  if (!validation.ok) return fail("VALIDATION_ERROR", "Please check the submitted data.", 422, validation.fields);

  let submission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      values: validation.values,
      sourceType,
      sourceId,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? null
    }
  });

  const fileRecords = await saveSubmissionFiles(submission.id, validation.files);
  if (fileRecords.length) {
    submission = await prisma.formSubmission.update({
      where: { id: submission.id },
      data: { files: fileRecords }
    });
  }

  const lead = await prisma.lead.create({
    data: {
      submissionId: submission.id,
      name: pickValue(validation.values, ["name", "fullName", "firstName", "contactName", "questionName"]),
      email: pickValue(validation.values, ["email", "emailAddress", "contactEmail"]),
      phone: pickValue(validation.values, ["phone", "phoneNumber", "contactPhone"]),
      companyName: pickValue(validation.values, ["company", "companyName", "organization"]),
      sourceType,
      sourceId,
      sourceFormId: form.id,
      status: "NEW",
      priority: "NORMAL"
    }
  });

  submission = await prisma.formSubmission.update({
    where: { id: submission.id },
    data: { leadId: lead.id }
  });

  let qaId: string | null = null;
  if (form.sourceType === "qa" || sourceType === "qa") {
    const title = pickValue(validation.values, ["questionTitle", "title", "subject"]) || "Submitted question";
    const question = pickValue(validation.values, ["question", "questionDetails", "details", "message"]) || title;
    const slugBase = slugify(title);
    const qa = await prisma.qaItem.create({
      data: {
        title,
        slug: await getUniqueQaSlug(slugBase || "submitted-question"),
        question,
        submitterName: lead.name,
        submitterEmail: lead.email,
        category: pickValue(validation.values, ["category"]) || null,
        status: "NEW",
        sourceType: "qa",
        sourceId,
        sourceFormId: form.id,
        submissionId: submission.id,
        leadId: lead.id
      }
    });
    qaId = qa.id;
  }

  await sendFormNotification({
    recipients: form.notificationEmails,
    subject: `New ${form.name} submission`,
    replyTo: lead.email,
    lines: [
      `Form: ${form.name}`,
      `Lead: /admin/leads/${lead.id}`,
      `Submission: /admin/forms/${form.id}/submissions`,
      `Source: ${sourceType}${sourceId ? `:${sourceId}` : ""}`,
      ...Object.entries(validation.values).map(([key, value]) => `${key}: ${String(value)}`)
    ]
  }).catch((error) => console.warn("Form notification failed.", error));

  return ok(
    {
      id: submission.id,
      leadId: lead.id,
      qaId,
      message: form.successMessage || "Thanks. Your submission has been received.",
      redirectUrl: form.redirectUrl && isSafePublicUrl(form.redirectUrl) ? form.redirectUrl : null
    },
    { status: 201 }
  );
}

function validateSubmission(fields: Array<{ key: string; type: string; label: string; required: boolean; options: unknown; validation: unknown; defaultValue: string | null }>, formData: FormData) {
  const values: Record<string, string | boolean | string[]> = {};
  const files: Array<{ key: string; file: File; label: string }> = [];
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const type = field.type as FormFieldType;
    const key = field.key;

    if (type === "file") {
      const file = formData.get(key);
      if (file instanceof File && file.size > 0) files.push({ key, file, label: field.label });
      else if (field.required) errors[key] = `${field.label} is required.`;
      continue;
    }

    if (type === "hidden") {
      values[key] = stringField(formData.get(key)) || field.defaultValue || "";
      continue;
    }

    if (type === "checkbox" || type === "consent") {
      const checked = formData.get(key) === "on" || formData.get(key) === "true" || formData.get(key) === "1";
      values[key] = checked;
      if (field.required && !checked) errors[key] = `${field.label} is required.`;
      continue;
    }

    if (type === "checkboxGroup") {
      const submitted = formData.getAll(key).map((value) => stringField(value)).filter(Boolean);
      values[key] = submitted;
      if (field.required && submitted.length === 0) errors[key] = `${field.label} is required.`;
      continue;
    }

    const value = stringField(formData.get(key)).trim();
    if (!value && field.required) {
      errors[key] = `${field.label} is required.`;
      continue;
    }
    if (!value) {
      values[key] = "";
      continue;
    }

    const options = normalizeOptions(field.options);
    if ((type === "select" || type === "radio") && options.length && !options.some((option) => option.value === value)) {
      errors[key] = `${field.label} has an invalid option.`;
      continue;
    }
    if (type === "email" && !z.string().email().safeParse(value).success) errors[key] = `${field.label} must be a valid email.`;
    if (type === "url" && !isSafePublicUrl(value)) errors[key] = `${field.label} must be a safe URL.`;
    if (type === "number" && !Number.isFinite(Number(value))) errors[key] = `${field.label} must be a number.`;
    if (type === "date" && Number.isNaN(Date.parse(value))) errors[key] = `${field.label} must be a valid date.`;

    const maxLength = getMaxLength(field.validation);
    if (maxLength && value.length > maxLength) errors[key] = `${field.label} must be ${maxLength} characters or fewer.`;
    values[key] = value;
  }

  return Object.keys(errors).length ? { ok: false as const, fields: errors } : { ok: true as const, values, files };
}

async function saveSubmissionFiles(submissionId: string, files: Array<{ key: string; file: File; label: string }>) {
  const savedFiles = [];
  for (const item of files) {
    const saved = await savePrivateUploadFile({
      entityType: "form-submissions",
      entityId: submissionId,
      file: item.file,
      allowedTypes: allowedFormFileTypes,
      category: "form-submission-file"
    });
    if (!saved) continue;

    const asset = await prisma.fileAsset.create({
      data: {
        filename: saved.relativePath,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        category: saved.category,
        url: "/api/admin/files/pending"
      }
    });
    await prisma.fileAsset.update({
      where: { id: asset.id },
      data: { url: `/api/admin/files/${asset.id}` }
    });
    savedFiles.push({
      key: item.key,
      label: item.label,
      fileId: asset.id,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      url: `/api/admin/files/${asset.id}`
    });
  }
  return savedFiles;
}

function getMaxLength(value: unknown) {
  if (typeof value !== "object" || value === null) return null;
  const maxLength = (value as Record<string, unknown>).maxLength;
  return typeof maxLength === "number" && Number.isFinite(maxLength) ? maxLength : null;
}

function jsonToFormData(body: unknown) {
  const data = new FormData();
  if (typeof body !== "object" || body === null) return data;
  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) value.forEach((item) => data.append(key, String(item)));
    else data.set(key, String(value ?? ""));
  }
  return data;
}

function stringField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function pickValue(values: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = values[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
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
