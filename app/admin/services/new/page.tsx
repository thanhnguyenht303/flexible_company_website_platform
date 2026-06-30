import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceForm } from "@/components/admin/ServiceForm";

export default function NewServicePage() {
  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>New Service</h1>
        <Link className="button secondary" href="/admin/services">
          Back
        </Link>
      </div>
      <ServiceForm />
    </AdminShell>
  );
}
