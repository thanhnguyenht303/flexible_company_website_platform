"use client";

import { useState } from "react";
import { Save } from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

export function SiteSettingsForm({ site }: { site: Record<string, unknown> }) {
  const [state, setState] = useState<SaveState>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/admin/settings/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setState(response.ok ? "saved" : "error");
  }

  return (
    <form className="admin-panel form-grid" onSubmit={submit}>
      {["siteName", "tagline", "description", "email", "phone", "address", "domain"].map((name) => (
        <div className="field" key={name}>
          <label htmlFor={name}>{labelize(name)}</label>
          <input id={name} name={name} defaultValue={stringValue(site[name])} />
        </div>
      ))}
      <button className="button" type="submit" disabled={state === "saving"}>
        <Save size={18} />
        {state === "saving" ? "Saving" : "Save"}
      </button>
      <StatusMessage state={state} />
    </form>
  );
}

export function ThemeSettingsForm({ theme }: { theme: Record<string, unknown> }) {
  const [state, setState] = useState<SaveState>("idle");
  const colorFields = ["primaryColor", "secondaryColor", "accentColor", "backgroundColor", "textColor"];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/admin/settings/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setState(response.ok ? "saved" : "error");
  }

  return (
    <form className="admin-panel form-grid" onSubmit={submit}>
      {colorFields.map((name) => (
        <div className="field" key={name}>
          <label htmlFor={name}>{labelize(name)}</label>
          <input id={name} name={name} type="color" defaultValue={stringValue(theme[name]) || "#2563EB"} />
        </div>
      ))}
      <div className="field">
        <label htmlFor="fontFamily">Font Family</label>
        <input id="fontFamily" name="fontFamily" defaultValue={stringValue(theme.fontFamily) || "Inter"} />
      </div>
      <div className="field">
        <label htmlFor="borderRadius">Border Radius</label>
        <select id="borderRadius" name="borderRadius" defaultValue={stringValue(theme.borderRadius) || "medium"}>
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
      <input type="hidden" name="headerLayout" value={stringValue(theme.headerLayout) || "classic"} />
      <input type="hidden" name="footerLayout" value={stringValue(theme.footerLayout) || "standard"} />
      <button className="button" type="submit" disabled={state === "saving"}>
        <Save size={18} />
        {state === "saving" ? "Saving" : "Save"}
      </button>
      <StatusMessage state={state} />
    </form>
  );
}

function StatusMessage({ state }: { state: SaveState }) {
  if (state === "idle" || state === "saving") return null;
  return (
    <p className={`message ${state === "error" ? "error" : ""}`}>
      {state === "saved" ? "Saved." : "Save failed."}
    </p>
  );
}

function labelize(value: string) {
  return value.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase());
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
