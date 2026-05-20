import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";

async function getCounts() {
  try {
    const [products, services, posts, inquiries] = await Promise.all([
      prisma.product.count(),
      prisma.service.count(),
      prisma.post.count(),
      prisma.inquiry.count()
    ]);
    return { products, services, posts, inquiries };
  } catch {
    return { products: 0, services: 0, posts: 0, inquiries: 0 };
  }
}

export default async function AdminDashboardPage() {
  const counts = await getCounts();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="admin-grid">
        {Object.entries(counts).map(([label, count]) => (
          <div className="admin-panel" key={label}>
            <h2>{label.replace(/^./, (letter) => letter.toUpperCase())}</h2>
            <div className="stat">
              <strong>{count}</strong>
              <span>Total records</span>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
