import { revalidatePath } from "next/cache";
import { fail, ok, validationFail } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { saveEntityImage } from "@/lib/image-storage";
import { hasPermission } from "@/lib/permissions";
import { rejectOversizedRequest } from "@/lib/request-size";
import { teamMemberSchema } from "@/modules/team/team.validation";

export async function GET() {
  const user = await requireAdminUser();
  if (!hasPermission(user, "team.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const team = await prisma.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return ok(team);
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "team.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const oversized = rejectOversizedRequest(request, env.MAX_UPLOAD_MB, "Team photo upload");
  if (oversized) return oversized;

  const { fields, photo } = await parseTeamRequest(request);
  const parsed = teamMemberSchema.safeParse(fields);
  if (!parsed.success) return validationFail(parsed.error);

  let member = await prisma.teamMember.create({
    data: {
      name: parsed.data.name,
      position: parsed.data.position || null,
      bio: parsed.data.bio || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      sortOrder: parsed.data.sortOrder,
      isVisible: parsed.data.isVisible
    }
  });

  if (photo) {
    const photoId = await saveTeamPhoto(member.id, member.name, photo, user.id);
    if (photoId) {
      member = await prisma.teamMember.update({
        where: { id: member.id },
        data: { photoId }
      });
    }
  }

  revalidatePath("/team");
  revalidatePath("/admin/team");
  revalidatePath("/");

  return ok(member, { status: 201 });
}

async function parseTeamRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const photoValue = formData.get("photo");

    return {
      fields: {
        name: stringField(formData.get("name")),
        position: stringField(formData.get("position")),
        bio: stringField(formData.get("bio")),
        email: stringField(formData.get("email")),
        phone: stringField(formData.get("phone")),
        sortOrder: stringField(formData.get("sortOrder")) || "0",
        isVisible: stringField(formData.get("isVisible")) || "true"
      },
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

function stringField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
