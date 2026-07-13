import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { csvCell } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: Request) {
  const user = await requireAdminUser();
  if (!hasPermission(user, "leads.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const sourceFormId = url.searchParams.get("formId")?.trim();

  const leads = await prisma.lead.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(sourceFormId ? { sourceFormId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
              { internalNote: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(leads), {
      headers: {
        "Content-Disposition": `attachment; filename="leads.csv"`,
        "Content-Type": "text/csv; charset=utf-8"
      }
    });
  }

  return ok(leads);
}

function toCsv(rows: Array<{ id: string; name: string | null; email: string | null; phone: string | null; companyName: string | null; sourceType: string; status: string; priority: string; createdAt: Date }>) {
  const headers = ["id", "name", "email", "phone", "companyName", "sourceType", "status", "priority", "createdAt"];
  const body = rows.map((row) =>
    [
      row.id,
      row.name ?? "",
      row.email ?? "",
      row.phone ?? "",
      row.companyName ?? "",
      row.sourceType,
      row.status,
      row.priority,
      row.createdAt.toISOString()
    ].map(csvCell).join(",")
  );
  return [headers.join(","), ...body].join("\n");
}
