import { z } from "zod";

const slugSchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only.");

export const roleInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
  description: z.string().trim().max(500).nullable().optional(),
  authorityKeys: z.array(z.string().min(1)).max(100)
});

export const userCreateSchema = z.object({
  username: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/),
  email: z.string().trim().email().nullable().optional(),
  displayName: z.string().trim().max(120).nullable().optional(),
  password: z.string().min(10).max(200),
  roleId: z.string().min(1)
});

export const userUpdateSchema = z.object({
  roleId: z.string().min(1),
  status: z.enum(["ACTIVE", "DISABLED"]),
  displayName: z.string().trim().max(120).nullable().optional()
});
