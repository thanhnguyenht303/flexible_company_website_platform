"use client";

export function LogoutButton({ children }: { children: React.ReactNode }) {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button type="button" onClick={logout}>
      {children}
    </button>
  );
}
