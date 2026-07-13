"use client";

import { useState } from "react";

export function InboxSyncButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function sync() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/email/inbox/sync", { method: "POST" });
    const result = await response.json();
    if (response.ok) {
      setMessage(`Imported ${result.data.imported}; skipped ${result.data.skipped} existing messages.`);
      window.location.reload();
    } else {
      setMessage(result.error?.message || "Inbox synchronization failed.");
      setBusy(false);
    }
  }
  return <div><button className="button" type="button" disabled={busy} onClick={sync}>{busy ? "Syncing…" : "Sync inbox"}</button>{message ? <p className="message" role="status">{message}</p> : null}</div>;
}
