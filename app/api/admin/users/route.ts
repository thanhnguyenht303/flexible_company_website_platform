import bcrypt from "bcryptjs";
import { getAdminUser } from "@/lib/auth";
import { fail, ok, validationFail } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { canAssignRole, hasAuthority } from "@/lib/permissions";
import { userCreateSchema } from "@/lib/admin-rbac-validation";

export async function GET() {
  const authorization = await authorize();
  if ("response" in authorization) return authorization.response;
  const users = await prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "asc" } });
  return ok(users.map(({ passwordHash: _passwordHash, ...user }) => user));
}

export async function POST(request: Request) {
  const authorization = await authorize();
  if ("response" in authorization) return authorization.response;
  const parsed = userCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const role = await prisma.role.findUnique({
    where: { id: parsed.data.roleId },
    include: { authorities: { include: { authority: true } } }
  });
  if (!role) return fail("INVALID_ROLE", "Role not found.", 422);
  if (!canAssignRole(authorization.user, role)) {
    return fail("ROLE_ESCALATION_FORBIDDEN", "You cannot assign a role with authorities you do not have.", 403);
  }
  try {
    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        email: parsed.data.email || null,
        displayName: parsed.data.displayName || null,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        roleId: parsed.data.roleId
      },
      include: { role: true }
    });
    return ok({ id: user.id, username: user.username, email: user.email, displayName: user.displayName, status: user.status, role: user.role }, { status: 201 });
  } catch {
    return fail("USER_CONFLICT", "That username or email is already in use.", 409);
  }
}

async function authorize() {
  const user = await getAdminUser();
  if (!user) return { response: fail("UNAUTHORIZED", "Authentication required.", 401) } as const;
  if (!hasAuthority(user, "users.manage")) return { response: fail("FORBIDDEN", "Forbidden.", 403) } as const;
  return { user } as const;
}
