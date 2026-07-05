import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireAdminUser();
  if (!hasPermission(user, "forms.manage")) return fail("FORBIDDEN", "Forbidden.", 403);

  const url = new URL(request.url);
  const submissions = await prisma.formSubmission.findMany({
    where: { formId: id },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(submissions), {
      headers: {
        "Content-Disposition": `attachment; filename="form-${id}-submissions.csv"`,
        "Content-Type": "text/csv; charset=utf-8"
      }
    });
  }

  return ok(submissions);
}

function toCsv(rows: Array<{ id: string; status: string; values: unknown; createdAt: Date }>) {
  const headers = ["id", "status", "createdAt", "values"];
  const body = rows.map((row) =>
    [row.id, row.status, row.createdAt.toISOString(), JSON.stringify(row.values)].map(csvCell).join(",")
  );
  return [headers.join(","), ...body].join("\n");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
