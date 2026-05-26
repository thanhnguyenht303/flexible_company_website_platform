import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>New Product</h1>
        <Link className="button secondary" href="/admin/products">
          Back
        </Link>
      </div>
      <ProductForm />
    </AdminShell>
  );
}
