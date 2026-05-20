"use client";

import Image from "next/image";
import { useState } from "react";
import { LogIn } from "lucide-react";

export function LoginForm() {
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
      setError(body?.error?.message ?? "Login failed.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin/dashboard";
  }

  return (
    <div className="login-panel">
      <Image src="/placeholder-logo.svg" alt="" width={44} height={44} />
      <h1>Admin Login</h1>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" autoComplete="username" required minLength={3} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
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
          {loading ? "Signing in" : "Sign in"}
        </button>
        {error ? <p className="message error">{error}</p> : null}
      </form>
    </div>
  );
}
