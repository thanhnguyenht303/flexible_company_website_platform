import { z } from "zod";

export const teamMemberSchema = z.object({
  name: z.string().min(2).max(160),
  position: z.string().max(160).optional().nullable(),
  positionVi: z.string().max(160).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  bioVi: z.string().max(2000).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(80).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isVisible: z.coerce.boolean().default(true)
});
