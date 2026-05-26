import { mkdir, rm, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export type ImageEntityType = "posts" | "products" | "services" | "team" | "logos" | "general";

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
    throw new Error("Only JPG, PNG, WEBP, and SVG images are allowed.");
  }

  const maxBytes = Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image exceeds ${process.env.MAX_UPLOAD_MB ?? 10}MB.`);
  }

  const safeName = sanitizeFilename(file.name);
  const relativePath = path.join(entityType, entityId, `${Date.now()}-${randomUUID()}-${safeName}`);
  const absolutePath = resolveImagePath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

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
