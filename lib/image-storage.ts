import { mkdir, rm, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ImageEntityType =
  | "posts"
  | "products"
  | "services"
  | "team"
  | "logos"
  | "theme-backgrounds"
  | "page-builder"
  | "general";

export function getImageStorageRoot() {
  return path.resolve(process.env.IMAGE_STORAGE_ROOT ?? path.join(process.cwd(), "..", "Images"));
}

export function resolveImagePath(relativePath: string) {
  const root = getImageStorageRoot();
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid image path.");
  }

  return resolved;
}

export async function saveEntityImage({
  entityType,
  entityId,
  file
}: {
  entityType: ImageEntityType;
  entityId: string;
  file: File;
}) {
  if (!file.size) return null;

  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed.");
  }

  const maxBytes = Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image exceeds ${process.env.MAX_UPLOAD_MB ?? 10}MB.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesImageSignature(file.type, bytes)) {
    throw new Error("Image content does not match the declared file type.");
  }

  const safeName = sanitizeFilename(file.name);
  const relativePath = path.join(entityType, entityId, `${Date.now()}-${randomUUID()}-${safeName}`);
  const absolutePath = resolveImagePath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    relativePath: relativePath.replace(/\\/g, "/"),
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size
  };
}

export async function deleteEntityImageFolder(entityType: ImageEntityType, entityId: string) {
  const folder = resolveImagePath(path.join(entityType, entityId));
  await rm(folder, { recursive: true, force: true });
}

export async function deleteStoredImage(relativePath: string) {
  await rm(resolveImagePath(relativePath), { force: true });
}

function sanitizeFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  const stem = path
    .basename(filename, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${stem || "image"}${extension}`;
}

function matchesImageSignature(mimeType: string, bytes: Buffer) {
  if (mimeType === "image/jpeg") {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "image/webp") {
    return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  }

  return false;
}
