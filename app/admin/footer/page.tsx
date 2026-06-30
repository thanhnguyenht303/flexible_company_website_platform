import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { FooterPartnerTableActions } from "@/components/admin/FooterPartnerTableActions";
import { prisma } from "@/lib/db";

async function getFooterPartners() {
  try {
    return await prisma.footerPartner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });
  } catch {
    return [];
  }
}

export default async function AdminFooterPage() {
  const partners = await getFooterPartners();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Footer</h1>
        <Link className="button" href="/admin/footer/new">
          New
        </Link>
      </div>
      <div className="admin-panel">
        <h2>Collaborating Companies</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Company</th>
              <th>Website</th>
              <th>Sort</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id}>
                <td>
                  <div className="footer-table-logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/${partner.logoId}`} alt="" />
                  </div>
                </td>
                <td>{partner.name}</td>
                <td>{partner.websiteUrl ? <a href={partner.websiteUrl}>{partner.websiteUrl}</a> : ""}</td>
                <td>{partner.sortOrder}</td>
                <td>
                  <span className="badge">{partner.isVisible ? "Yes" : "No"}</span>
                </td>
                <td>
                  <FooterPartnerTableActions
                    id={partner.id}
                    title={partner.name}
                    isVisible={partner.isVisible}
                  />
                </td>
              </tr>
            ))}
            {partners.length === 0 ? (
              <tr>
                <td colSpan={6}>No footer collaborators yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
