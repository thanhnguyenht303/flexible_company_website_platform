import { mkdir, rm, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

const allowedResumeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export type FileEntityType = "job-applications" | "form-submissions" | "general";

export function getFileStorageRoot() {
  return path.resolve(process.env.FILE_STORAGE_ROOT ?? path.join(process.cwd(), "..", "files_storage"));
}

export function resolveFilePath(relativePath: string) {
  const root = getFileStorageRoot();
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file path.");
  }

  return resolved;
}

export async function saveResumeFile({
  entityId,
  file
}: {
  entityId: string;
  file: File;
}) {
  if (!file.size) return null;

  if (!allowedResumeTypes.has(file.type)) {
    throw new Error("Only PDF, DOC, and DOCX resume files are allowed.");
  }

  const maxBytes = Number(process.env.MAX_FILE_UPLOAD_MB ?? process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File exceeds ${process.env.MAX_FILE_UPLOAD_MB ?? process.env.MAX_UPLOAD_MB ?? 10}MB.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesResumeSignature(file.type, bytes)) {
    throw new Error("File content does not match the declared resume file type.");
  }

  const safeName = sanitizeFilename(file.name);
  const relativePath = path.join("job-applications", entityId, `${Date.now()}-${randomUUID()}-${safeName}`);
  const absolutePath = resolveFilePath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    relativePath: relativePath.replace(/\\/g, "/"),
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size
  };
}

export async function savePrivateUploadFile({
  entityType,
  entityId,
  file,
  allowedTypes = allowedResumeTypes,
  category = "private-upload"
}: {
  entityType: FileEntityType;
  entityId: string;
  file: File;
  allowedTypes?: Set<string>;
  category?: string;
}) {
  if (!file.size) return null;

  if (!allowedTypes.has(file.type)) {
    throw new Error("This file type is not allowed.");
  }

  const maxBytes = Number(process.env.MAX_FILE_UPLOAD_MB ?? process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File exceeds ${process.env.MAX_FILE_UPLOAD_MB ?? process.env.MAX_UPLOAD_MB ?? 10}MB.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesAllowedFileSignature(file.type, bytes)) {
    throw new Error("File content does not match the declared file type.");
  }

  const safeName = sanitizeFilename(file.name);
  const relativePath = path.join(entityType, entityId, `${Date.now()}-${randomUUID()}-${safeName}`);
  const absolutePath = resolveFilePath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    relativePath: relativePath.replace(/\\/g, "/"),
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    category
  };
}

export async function deleteStoredFile(relativePath: string) {
  await rm(resolveFilePath(relativePath), { force: true });
}

export async function deleteFileFolder(entityType: FileEntityType, entityId: string) {
  await rm(resolveFilePath(path.join(entityType, entityId)), { recursive: true, force: true });
}

function sanitizeFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  const stem = path
    .basename(filename, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${stem || "file"}${extension}`;
}

function matchesResumeSignature(mimeType: string, bytes: Buffer) {
  return matchesAllowedFileSignature(mimeType, bytes);
}

function matchesAllowedFileSignature(mimeType: string, bytes: Buffer) {
  if (mimeType === "application/pdf") {
    return bytes.subarray(0, 4).toString("ascii") === "%PDF";
  }

  if (mimeType === "application/msword") {
    return bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  }

  return false;
}
