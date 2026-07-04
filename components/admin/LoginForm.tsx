"use client";

import Image from "next/image";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

export function LoginForm() {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error?.message ?? t("admin.forms.login.failed"));
      setLoading(false);
      return;
    }

    window.location.href = "/admin/dashboard";
  }

  return (
    <div className="login-panel">
      <Image src="/placeholder-logo.svg" alt="" width={44} height={44} />
      <h1>{t("admin.forms.login.title")}</h1>
      <form className="form-grid" method="post" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="username">{t("admin.common.username")}</label>
          <input id="username" name="username" autoComplete="username" required minLength={3} />
        </div>
        <div className="field">
          <label htmlFor="password">{t("admin.common.password")}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={10}
          />
        </div>
        <button className="button" type="submit" disabled={loading}>
          <LogIn size={18} />
          {loading ? t("admin.forms.login.signingIn") : t("admin.forms.login.signIn")}
        </button>
        {error ? <p className="message error">{error}</p> : null}
      </form>
    </div>
  );
}
