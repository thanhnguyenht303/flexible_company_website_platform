import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceTableActions } from "@/components/admin/ServiceTableActions";
import { prisma } from "@/lib/db";

async function getServices() {
  try {
    return await prisma.service.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return [];
  }
}

export default async function AdminServicesPage() {
  const services = await getServices();

  return (
    <AdminShell>
      <div className="admin-page-header">
        <h1>Services</h1>
        <Link className="button" href="/admin/services/new">
          New
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Images</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.slug}>
                <td>
                  {service.imageId ? (
                    <div className="table-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/media/${service.imageId}`} alt="" />
                    </div>
                  ) : (
                    "None"
                  )}
                </td>
                <td>{service.name}</td>
                <td>{service.slug}</td>
                <td>
                  <span className="badge">{service.status}</span>
                </td>
                <td>{getGalleryIds(service.gallery).length}</td>
                <td>
                  <ServiceTableActions
                    id={service.id}
                    slug={service.slug}
                    title={service.name}
                    status={service.status}
                  />
                </td>
              </tr>
            ))}
            {services.length === 0 ? (
              <tr>
                <td colSpan={6}>No services yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function getGalleryIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
