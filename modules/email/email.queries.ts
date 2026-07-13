import "server-only";

import { EmailDirection } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listEmailMessages(request: Request, direction?: EmailDirection) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 50)));
  const where = {
    ...(direction ? { direction } : {}),
    ...(status ? { status: status as never } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" as const } },
            { fromEmail: { contains: q, mode: "insensitive" as const } },
            { body: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const [items, total] = await Promise.all([
    prisma.emailMessage.findMany({
      where,
      include: { template: { select: { id: true, name: true, key: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.emailMessage.count({ where })
  ]);
  return { items, total, page, pageSize };
}
