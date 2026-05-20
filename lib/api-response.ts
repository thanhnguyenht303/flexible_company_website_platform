import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(code: string, message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, fields }
    },
    { status }
  );
}

export function validationFail(error: ZodError) {
  const fields = Object.fromEntries(
    error.issues.map((issue) => [issue.path.join(".") || "form", issue.message])
  );

  return fail("VALIDATION_ERROR", "Please check the submitted data.", 422, fields);
}
