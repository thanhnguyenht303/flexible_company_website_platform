import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { deleteEntityImageFolder, deleteStoredImage, saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { teamMemberSchema } from "@/modules/team/team.validation";

const updateTeamMemberSchema = teamMemberSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required."
});

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "team.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) return fail("NOT_FOUND", "Employee not found.", 404);

  return ok(member);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "team.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Employee not found.", 404);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Team photo upload");
  if (oversized) return oversized;

  const { fields, photo } = await parseTeamRequest(request);
  const parsed = updateTeamMemberSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  let photoId = existing.photoId;

  if (photo) {
    if (existing.photoId) {
      const asset = await prisma.mediaAsset.findUnique({ where: { id: existing.photoId } });
      if (asset?.filename.startsWith(`team/${id}/`)) {
        await deleteStoredImage(asset.filename);
      }
      await prisma.mediaAsset.delete({ where: { id: existing.photoId } }).catch(() => null);
    }

    photoId = await saveTeamPhoto(id, parsed.data.name ?? existing.name, photo, user.id);
  }

  const member = await prisma.teamMember.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.position !== undefined ? { position: parsed.data.position || null } : {}),
      ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio || null } : {}),
      ...(parsed.data.email !== undefined ? { email: parsed.data.email || null } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone || null } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.isVisible !== undefined ? { isVisible: parsed.data.isVisible } : {}),
      ...(photo ? { photoId } : {})
    }
  });

  revalidatePath("/team");
  revalidatePath("/admin/team");
  revalidatePath("/");

  return ok(member);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "team.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Employee not found.", 404);

  await prisma.teamMember.delete({ where: { id } });
  await prisma.mediaAsset.deleteMany({
    where: {
      filename: {
        startsWith: `team/${id}/`
      }
    }
  });
  await deleteEntityImageFolder("team", id);

  revalidatePath("/team");
  revalidatePath("/admin/team");
  revalidatePath("/");

  return ok({ deleted: true });
}

async function parseTeamRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const photoValue = formData.get("photo");
    const fields: Record<string, string> = {};

    for (const field of ["name", "position", "bio", "email", "phone", "sortOrder", "isVisible"]) {
      const value = formData.get(field);
      if (typeof value === "string") fields[field] = value;
    }

    return {
      fields,
      photo: photoValue instanceof File && photoValue.size > 0 ? photoValue : null
    };
  }

  return {
    fields: await request.json().catch(() => null),
    photo: null
  };
}

async function saveTeamPhoto(memberId: string, memberName: string, photo: File, userId: string) {
  const savedImage = await saveEntityImage({ entityType: "team", entityId: memberId, file: photo });
  if (!savedImage) return null;

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: savedImage.relativePath,
      originalName: savedImage.originalName,
      mimeType: savedImage.mimeType,
      sizeBytes: savedImage.sizeBytes,
      url: "/api/media/pending",
      altText: memberName,
      uploadedById: userId
    }
  });

  await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { url: `/api/media/${asset.id}` }
  });

  return asset.id;
}
