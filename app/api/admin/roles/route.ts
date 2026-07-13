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

export async function GET() {
  const authorization = await authorize();
  if ("response" in authorization) return authorization.response;

  const roles = await prisma.role.findMany({
    include: { _count: { select: { users: true, authorities: true } } },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }]
  });
  return ok(roles);
}

export async function POST(request: Request) {
  const authorization = await authorize();
  if ("response" in authorization) return authorization.response;
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
    const role = await prisma.role.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        permissions: Object.fromEntries(authorities.map(({ key }) => [key, true])),
        authorities: { create: authorities.map(({ id }) => ({ authorityId: id })) }
      },
      include: { authorities: { include: { authority: true } } }
    });
    return ok(role, { status: 201 });
  } catch {
    return fail("ROLE_CONFLICT", "A role with this name or slug already exists.", 409);
  }
}
