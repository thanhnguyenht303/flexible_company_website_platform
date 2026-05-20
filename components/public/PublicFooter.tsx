import Link from "next/link";

type PublicFooterProps = {
  site: {
    siteName: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
};

export function PublicFooter({ site }: PublicFooterProps) {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <strong>{site.siteName}</strong>
          <p>{site.address}</p>
        </div>
        <nav className="nav" aria-label="Footer navigation">
          <Link href="/privacy">Privacy</Link>
          {site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : null}
          {site.phone ? <a href={`tel:${site.phone}`}>{site.phone}</a> : null}
        </nav>
      </div>
    </footer>
  );
}
