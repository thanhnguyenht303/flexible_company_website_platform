import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { LanguageProvider } from "@/components/public/LanguageProvider";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { getAdminUser } from "@/lib/auth";
import { getCurrentLanguage } from "@/lib/i18n/server";

export default async function AdminLoginPage() {
  const [user, language] = await Promise.all([getAdminUser(), getCurrentLanguage()]);
  if (user) redirect("/admin/dashboard");

  return (
    <LanguageProvider initialLanguage={language}>
      <main className="login-page">
        <div className="login-language">
          <LanguageSwitcher />
        </div>
        <LoginForm />
      </main>
    </LanguageProvider>
  );
}
