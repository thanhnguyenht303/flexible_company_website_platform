import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmailComposeForm } from "@/components/admin/email/EmailComposeForm";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { hasAuthority } from "@/lib/permissions";

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [inquiry, user] = await Promise.all([prisma.inquiry.findUnique({ where: { id: (await params).id } }), getAdminUser()]);
  if (!inquiry) notFound();
  const canEmail = hasAuthority(user, "email.manage");
  const templates = canEmail ? await prisma.emailTemplate.findMany({ where: { isActive: true, category: { in: ["contact", "general"] } }, orderBy: { name: "asc" }, select: { id: true, name: true, key: true, subject: true, body: true, category: true, customVariables: true } }) : [];
  return <AdminShell requiredAuthority="inquiries.manage"><div className="admin-page-header"><div><h1>{inquiry.name}</h1><p className="message">{inquiry.email} · {inquiry.createdAt.toLocaleString()}</p></div><Link className="button secondary" href="/admin/inquiries">Back</Link></div><article className="admin-panel"><h2>Message</h2><p>{inquiry.message}</p></article>{canEmail ? <EmailComposeForm initialTo={inquiry.email} templates={templates} relatedType="inquiry" relatedId={inquiry.id} variables={{ senderName: inquiry.name, senderEmail: inquiry.email, senderPhone: inquiry.phone || "", message: inquiry.message }} /> : null}</AdminShell>;
}
