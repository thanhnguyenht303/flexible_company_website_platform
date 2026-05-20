import { destroyAdminSession } from "@/lib/auth";
import { ok } from "@/lib/api-response";

export async function POST() {
  destroyAdminSession();
  return ok({ signedOut: true });
}
