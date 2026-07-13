import Link from "next/link";

type Message = {
  id: string; direction: string; status: string; fromEmail: string | null; toEmails: string[]; subject: string;
  relatedType: string | null; relatedId: string | null; errorMessage: string | null; createdAt: Date; sentAt: Date | null; receivedAt: Date | null; readAt: Date | null;
};

export function EmailMessageTable({ messages, emptyLabel }: { messages: Message[]; emptyLabel: string }) {
  return <div className="admin-panel"><div className="table-scroll"><table className="table"><thead><tr><th>From / To</th><th>Subject</th><th>Related</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>
    {messages.map((message) => <tr key={message.id} className={message.direction === "INBOUND" && !message.readAt ? "email-row--unread" : undefined}>
      <td>{message.direction === "INBOUND" ? message.fromEmail || "—" : message.toEmails.join(", ") || "—"}</td>
      <td><strong>{message.subject}</strong>{message.errorMessage ? <span className="table-secondary-line email-error">{message.errorMessage}</span> : null}</td>
      <td>{message.relatedType ? <><span>{message.relatedType}</span><span className="table-secondary-line">{message.relatedId}</span></> : "—"}</td>
      <td><span className={`badge badge--${message.status === "SENT" || message.status === "RECEIVED" ? "success" : message.status === "FAILED" ? "danger" : "muted"}`}>{message.status}</span></td>
      <td>{(message.receivedAt || message.sentAt || message.createdAt).toLocaleString()}</td>
      <td><Link className="button secondary" href={`/admin/email/messages/${message.id}`}>Open</Link></td>
    </tr>)}
    {!messages.length ? <tr><td colSpan={6}>{emptyLabel}</td></tr> : null}
  </tbody></table></div></div>;
}
