import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmailCenterNav } from "@/components/admin/email/EmailCenterNav";
import { EmailReplyForm } from "@/components/admin/email/EmailReplyForm";
import { requireAdminAuthority } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function EmailMessagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAuthority("email.manage");
  const message = await prisma.emailMessage.findUnique({ where: { id: (await params).id }, include: { template: true } });
  if (!message) notFound();
  if (message.direction === "INBOUND" && !message.readAt) await prisma.emailMessage.update({ where: { id: message.id }, data: { readAt: new Date() } });
  return <AdminShell requiredAuthority="email.manage"><div className="admin-page-header"><div><h1>{message.subject}</h1><p className="message">{message.direction} · {message.status} · {message.createdAt.toLocaleString()}</p></div></div><EmailCenterNav /><article className="admin-panel email-message-detail"><dl><dt>From</dt><dd>{message.fromName ? `${message.fromName} <${message.fromEmail}>` : message.fromEmail || "—"}</dd><dt>To</dt><dd>{message.toEmails.join(", ") || "—"}</dd><dt>CC</dt><dd>{message.ccEmails.join(", ") || "—"}</dd><dt>Related</dt><dd>{message.relatedType ? `${message.relatedType}:${message.relatedId}` : "—"}</dd><dt>Provider ID</dt><dd>{message.providerMessageId || "—"}</dd></dl>{message.errorMessage ? <p className="email-error">{message.errorMessage}</p> : null}<pre>{message.body}</pre></article><EmailReplyForm messageId={message.id} /></AdminShell>;
}
