import { getAdminUser } from "@/lib/auth";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { canAssignRole, hasAuthority, isSuperAdminRole } from "@/lib/permissions";
import { userUpdateSchema } from "@/lib/admin-rbac-validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorize();
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  const parsed = userUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const [target, nextRole] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: { role: true } }),
    prisma.role.findUnique({
      where: { id: parsed.data.roleId },
      include: { authorities: { include: { authority: true } } }
    })
  ]);
  if (!target) return fail("NOT_FOUND", "User not found.", 404);
  if (!nextRole) return fail("INVALID_ROLE", "Role not found.", 422);
  if (!canAssignRole(authorization.user, nextRole)) {
    return fail("ROLE_ESCALATION_FORBIDDEN", "You cannot assign a role with authorities you do not have.", 403);
  }

  const removesActiveSuperAdmin = target.status === "ACTIVE" && isSuperAdminRole(target.role) &&
    (parsed.data.status !== "ACTIVE" || !isSuperAdminRole(nextRole));
  if (removesActiveSuperAdmin && await activeSuperAdminCount() <= 1) {
    return fail("LAST_SUPER_ADMIN", "The last active Super Admin cannot be disabled or demoted.", 409);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { roleId: parsed.data.roleId, status: parsed.data.status, displayName: parsed.data.displayName || null },
    include: { role: true }
  });
  return ok({ id: user.id, username: user.username, email: user.email, displayName: user.displayName, status: user.status, role: user.role });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorize();
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  if (id === authorization.user.id) return fail("SELF_DELETE", "You cannot delete your own account.", 409);
  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!target) return fail("NOT_FOUND", "User not found.", 404);
  if (target.status === "ACTIVE" && isSuperAdminRole(target.role) && await activeSuperAdminCount() <= 1) {
    return fail("LAST_SUPER_ADMIN", "The last active Super Admin cannot be deleted.", 409);
  }
  await prisma.user.delete({ where: { id } });
  return ok({ deleted: true });
}

async function activeSuperAdminCount() {
  return prisma.user.count({
    where: {
      status: "ACTIVE",
      role: { OR: [{ slug: "super-admin" }, { name: { equals: "Super Admin", mode: "insensitive" } }] }
    }
  });
}

async function authorize() {
  const user = await getAdminUser();
  if (!user) return { response: fail("UNAUTHORIZED", "Authentication required.", 401) } as const;
  if (!hasAuthority(user, "users.manage")) return { response: fail("FORBIDDEN", "Forbidden.", 403) } as const;
  return { user } as const;
}
