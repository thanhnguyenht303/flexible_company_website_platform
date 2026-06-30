import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { FooterPartnerForm } from "@/components/admin/FooterPartnerForm";
import { prisma } from "@/lib/db";

async function getFooterPartner(id: string) {
  try {
    return await prisma.footerPartner.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function EditFooterPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await getFooterPartner(id);
  if (!partner) notFound();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Edit Footer Collaborator</h1>
        <Link className="button secondary" href="/admin/footer">
          Back
        </Link>
      </div>
      <FooterPartnerForm
        partner={{
          id: partner.id,
          name: partner.name,
          websiteUrl: partner.websiteUrl,
          sortOrder: partner.sortOrder,
          isVisible: partner.isVisible,
          logoId: partner.logoId
        }}
      />
    </AdminShell>
  );
}
