import { PublishStatus } from "@prisma/client";
import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { deleteFileFolder, saveResumeFile } from "@/lib/file-storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { readRequestWithBodyLimit } from "@/lib/request-size";
import { env } from "@/lib/env";
import { sendAdminNotification } from "@/modules/email/email.service";

const jobApplicationSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  email: z.string().email("Email is invalid").max(180),
  phone: z.string().max(60).optional().or(z.literal("")),
  companyName: z.string().max(160).optional().or(z.literal("")),
  message: z.string().max(5000).optional().or(z.literal(""))
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rateLimit = checkRateLimit({
    key: `public:job-application:${getClientIp(request)}:${id}`,
    limit: 3,
    windowMs: 15 * 60_000
  });
  if (!rateLimit.allowed) {
    return fail("RATE_LIMITED", `Too many applications. Try again in ${rateLimit.retryAfterSeconds} seconds.`, 429);
  }

  const job = await prisma.jobPosting.findFirst({
    where: {
      id,
      status: PublishStatus.PUBLISHED
    }
  });

  if (!job) return fail("NOT_FOUND", "Job posting is not available.", 404);

  const limited = await readRequestWithBodyLimit(request, env.MAX_FILE_UPLOAD_MB, "Resume upload");
  if ("response" in limited) return limited.response;

  const formData = await limited.request.formData();
  if (stringField(formData.get("website")).trim()) {
    return fail("VALIDATION_ERROR", "Please check the submitted data.", 422);
  }

  const resumeValue = formData.get("resume");
  if (!(resumeValue instanceof File) || resumeValue.size === 0) {
    return fail("RESUME_REQUIRED", "Please upload a resume file.", 422, { resume: "Resume is required." });
  }

  const parsed = jobApplicationSchema.safeParse({
    name: stringField(formData.get("name")),
    email: stringField(formData.get("email")),
    phone: stringField(formData.get("phone")),
    companyName: stringField(formData.get("companyName")),
    message: stringField(formData.get("message"))
  });
  if (!parsed.success) return validationFail(parsed.error);

  const application = await prisma.jobApplication.create({
    data: {
      jobId: job.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      companyName: parsed.data.companyName || null,
      message: parsed.data.message || null
    }
  });

  const savedFile = await saveResumeFile({ entityId: application.id, file: resumeValue }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Resume file could not be saved.";
    return { error: message };
  });

  if (savedFile && "error" in savedFile) {
    await prisma.jobApplication.delete({ where: { id: application.id } }).catch(() => null);
    await deleteFileFolder("job-applications", application.id).catch(() => null);
    return fail("UPLOAD_FAILED", savedFile.error, 422);
  }

  if (!savedFile) {
    await prisma.jobApplication.delete({ where: { id: application.id } }).catch(() => null);
    return fail("UPLOAD_FAILED", "Resume file could not be saved.", 422);
  }

  const fileAsset = await prisma.fileAsset.create({
    data: {
      filename: savedFile.relativePath,
      originalName: savedFile.originalName,
      mimeType: savedFile.mimeType,
      sizeBytes: savedFile.sizeBytes,
      category: "job-application-resume",
      url: "/api/admin/files/pending"
    }
  });

  await prisma.fileAsset.update({
    where: { id: fileAsset.id },
    data: { url: `/api/admin/files/${fileAsset.id}` }
  });

  const completedApplication = await prisma.jobApplication.update({
    where: { id: application.id },
    data: { resumeFileId: fileAsset.id }
  });

  await prisma.inquiry.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      companyName: parsed.data.companyName || "Job applicant",
      message: `Job application for ${job.title}\n\n${parsed.data.message || "Resume uploaded."}`,
      sourceType: "career",
      sourceId: job.id
    }
  });

  const site = await prisma.siteSetting.findFirst({ select: { siteName: true } });
  const adminLink = `${env.NEXT_PUBLIC_SITE_URL}/admin/careers/${job.id}/applications`;
  await sendAdminNotification({
    recipients: job.applyEmail ? [job.applyEmail] : [],
    templateKey: "career.application.received",
    subject: `New application for ${job.title}`,
    body: `Applicant: ${parsed.data.name}\nEmail: ${parsed.data.email}\nPhone: ${parsed.data.phone || "Not provided"}\nPosition: ${job.title}\nReview: ${adminLink}`,
    variables: {
      applicantName: parsed.data.name,
      applicantEmail: parsed.data.email,
      applicantPhone: parsed.data.phone || "Not provided",
      positionTitle: job.title,
      applicationDate: completedApplication.createdAt.toISOString(),
      coverMessage: parsed.data.message || "",
      adminLink,
      siteName: site?.siteName || ""
    },
    replyTo: parsed.data.email,
    relatedType: "jobApplication",
    relatedId: completedApplication.id,
    metadata: { jobId: job.id, resumeFileId: fileAsset.id }
  }).catch((error) => console.warn("Career application notification failed.", error));

  return ok({ id: completedApplication.id }, { status: 201 });
}

function stringField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
