import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceTableActions } from "@/components/admin/ServiceTableActions";
import { prisma } from "@/lib/db";
import { localizedField } from "@/lib/i18n/content";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

async function getServices() {
  return prisma.service.findMany({ orderBy: { createdAt: "desc" } });
}

export default async function AdminServicesPage() {
  const [services, { language, t }] = await Promise.all([getServices(), getServerTranslations()]);

  return (
    <AdminShell requiredAuthority="services.manage">
      <div className="admin-page-header">
        <h1>{t("admin.common.services")}</h1>
        <Link className="button" href="/admin/services/new">
          {t("admin.common.new")}
        </Link>
      </div>
      <div className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("admin.common.image")}</th>
              <th scope="col">{t("admin.common.name")}</th>
              <th scope="col">{t("admin.common.slug")}</th>
              <th scope="col">{t("admin.common.status")}</th>
              <th scope="col">{t("admin.common.images")}</th>
              <th scope="col">{t("admin.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => {
              const name = localizedField(service, "name", language);
              return (
                <tr key={service.slug}>
                  <td>
                    {service.imageId ? (
                      <div className="table-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/media/${service.imageId}`} alt="" />
                      </div>
                    ) : (
                      t("admin.common.none")
                    )}
                  </td>
                  <td>{name}</td>
                  <td>{service.slug}</td>
                  <td>
                    <span className="badge">{t(`admin.status.${service.status}`)}</span>
                  </td>
                  <td>{getGalleryIds(service.gallery).length}</td>
                  <td>
                    <ServiceTableActions id={service.id} slug={service.slug} title={name} status={service.status} />
                  </td>
                </tr>
              );
            })}
            {services.length === 0 ? (
              <tr>
                <td colSpan={6}>{t("admin.empty.services")}</td>
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
