import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { getPublicSiteContext } from "@/lib/public-data";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const { site } = await getPublicSiteContext();

  return (
    <div className="public-shell">
      <PublicHeader siteName={site.siteName} />
      <main className="public-main">{children}</main>
      <PublicFooter site={site} />
    </div>
  );
}
