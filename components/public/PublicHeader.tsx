"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type PublicHeaderProps = {
  siteName: string;
  logoId?: string | null;
  navItems: Array<{
    title: string;
    href: string;
  }>;
};

export function PublicHeader({ siteName, logoId, navItems }: PublicHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand">
          <Image src={logoId ? `/api/media/${logoId}` : "/placeholder-logo.svg"} alt="" width={38} height={38} priority />
          <span>{siteName}</span>
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link className={isActive ? "active" : undefined} href={item.href} key={item.href} aria-current={isActive ? "page" : undefined}>
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
