import Link from "next/link";
import type { PublicFooterPartner } from "@/lib/footer-partners";

type PublicFooterProps = {
  site: {
    siteName: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  showPrivacy: boolean;
  partners: PublicFooterPartner[];
};

export function PublicFooter({ site, showPrivacy, partners }: PublicFooterProps) {
  return (
    <footer className="site-footer">
      {partners.length ? (
        <div className="container footer-collaborators">
          <div>
            <h2>Collaborating Companies</h2>
            <p>Companies and businesses that collaborate with us or have worked with us before.</p>
          </div>
          <div className="footer-partner-grid">
            {partners.map((partner) => {
              const content = (
                <>
                  <span className="footer-partner-logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/${partner.logoId}`} alt="" />
                  </span>
                  <span>{partner.name}</span>
                </>
              );

              return partner.websiteUrl ? (
                <a className="footer-partner" href={partner.websiteUrl} key={partner.id}>
                  {content}
                </a>
              ) : (
                <div className="footer-partner" key={partner.id}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="container site-footer__inner">
        <div>
          <strong>{site.siteName}</strong>
          <p>{site.address}</p>
        </div>
        <nav className="nav" aria-label="Footer navigation">
          {showPrivacy ? <Link href="/privacy">Privacy</Link> : null}
          {site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : null}
          {site.phone ? <a href={`tel:${site.phone}`}>{site.phone}</a> : null}
        </nav>
      </div>
    </footer>
  );
}
