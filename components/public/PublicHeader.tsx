"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { useLanguage } from "@/components/public/LanguageProvider";
import type { PublicPageSlug } from "@/config/public-pages";

type PublicHeaderProps = {
  siteName: string;
  logoId?: string | null;
  navItems: Array<{
    slug: PublicPageSlug;
    title: string;
    href: string;
  }>;
};

export function PublicHeader({ siteName, logoId, navItems }: PublicHeaderProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand">
          <Image src={logoId ? `/api/media/${logoId}` : "/placeholder-logo.svg"} alt="" width={38} height={38} priority />
          <span>{siteName}</span>
        </Link>
        <div className="site-header__nav">
          <nav className="nav" aria-label={t("shell.primaryNavigation")}>
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link className={isActive ? "active" : undefined} href={item.href} key={item.href} aria-current={isActive ? "page" : undefined}>
                  {t(`nav.${item.slug}`) || item.title}
                </Link>
              );
            })}
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
