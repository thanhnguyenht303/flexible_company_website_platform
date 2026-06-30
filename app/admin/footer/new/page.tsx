import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { FooterPartnerForm } from "@/components/admin/FooterPartnerForm";

export default function NewFooterPartnerPage() {
  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>New Footer Collaborator</h1>
        <Link className="button secondary" href="/admin/footer">
          Back
        </Link>
      </div>
      <FooterPartnerForm />
    </AdminShell>
  );
}
