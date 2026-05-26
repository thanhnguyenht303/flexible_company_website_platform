import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminUser } from "@/lib/auth";

export default async function AdminLoginPage() {
  const user = await getAdminUser();
  if (user) redirect("/admin/dashboard");

  return (
    <main className="login-page">
      <LoginForm />
    </main>
  );
}
