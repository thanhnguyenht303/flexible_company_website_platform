import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSiteContext } from "@/lib/public-data";

export default async function AdminProductsPage() {
  const { products } = await getPublicSiteContext();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Products</h1>
        <button className="button" type="button">
          New
        </button>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.slug}>
                <td>{product.name}</td>
                <td>{product.slug}</td>
                <td>
                  <span className="badge">Published</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
