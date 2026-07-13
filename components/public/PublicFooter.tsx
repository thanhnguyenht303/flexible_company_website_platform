"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/public/LanguageProvider";
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
  style?: CSSProperties;
};

export function PublicFooter({ site, showPrivacy, partners, style }: PublicFooterProps) {
  const { t } = useLanguage();

  return (
    <footer className="site-footer" style={style}>
      {partners.length ? (
        <div className="container footer-collaborators">
          <div>
            <h2>{t("footer.collaboratorsTitle")}</h2>
            <p>{t("footer.collaboratorsText")}</p>
          </div>
          <div className="footer-partner-grid">
            {partners.map((partner) => {
              const content = (
                <>
                  <span className="footer-partner-logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="footer-partner-logo-image"
                      src={`/api/media/${partner.logoId}`}
                      alt={`${partner.name} logo`}
                      loading="lazy"
                      decoding="async"
                    />
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
        <nav className="nav" aria-label={t("shell.footerNavigation")}>
          {showPrivacy ? <Link href="/privacy">{t("nav.privacy")}</Link> : null}
          {site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : null}
          {site.phone ? <a href={`tel:${site.phone}`}>{site.phone}</a> : null}
        </nav>
      </div>
    </footer>
  );
}
