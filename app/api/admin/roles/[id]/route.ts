import { getAdminUser } from "@/lib/auth";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { canDelegateAuthorityKeys, hasAuthority } from "@/lib/permissions";
import { roleInputSchema } from "@/lib/admin-rbac-validation";

async function authorize() {
  const user = await getAdminUser();
  if (!user) return { response: fail("UNAUTHORIZED", "Authentication required.", 401) } as const;
  if (!hasAuthority(user, "roles.manage")) return { response: fail("FORBIDDEN", "Forbidden.", 403) } as const;
  return { user } as const;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorize();
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Role not found.", 404);
  if (existing.isSystem) return fail("SYSTEM_ROLE", "System roles cannot be changed.", 409);

  const parsed = roleInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const authorities = await prisma.authority.findMany({
    where: { key: { in: parsed.data.authorityKeys } },
    select: { id: true, key: true }
  });
  if (authorities.length !== new Set(parsed.data.authorityKeys).size) {
    return fail("INVALID_AUTHORITIES", "One or more authorities are invalid.", 422);
  }
  if (!canDelegateAuthorityKeys(authorization.user, parsed.data.authorityKeys)) {
    return fail("AUTHORITY_ESCALATION_FORBIDDEN", "You cannot grant authorities you do not have.", 403);
  }

  try {
    const role = await prisma.$transaction(async (tx) => {
      await tx.roleAuthority.deleteMany({ where: { roleId: id } });
      return tx.role.update({
        where: { id },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description || null,
          permissions: Object.fromEntries(authorities.map(({ key }) => [key, true])),
          authorities: { create: authorities.map(({ id: authorityId }) => ({ authorityId })) }
        },
        include: { authorities: { include: { authority: true } } }
      });
    });
    return ok(role);
  } catch {
    return fail("ROLE_CONFLICT", "A role with this name or slug already exists.", 409);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorize();
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) return fail("NOT_FOUND", "Role not found.", 404);
  if (role.isSystem) return fail("SYSTEM_ROLE", "System roles cannot be deleted.", 409);
  if (role._count.users > 0) return fail("ROLE_IN_USE", "Reassign this role's users before deleting it.", 409);
  await prisma.role.delete({ where: { id } });
  return ok({ deleted: true });
}
