"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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
  style?: CSSProperties;
};

export function PublicHeader({ siteName, logoId, navItems, style }: PublicHeaderProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigationPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        navigationPanelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const closeOnDesktop = () => {
      if (window.matchMedia("(min-width: 901px)").matches) setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
      menuButton?.focus();
    };
  }, [menuOpen]);

  return (
    <header className="site-header" style={style}>
      <div className="container site-header__inner">
        <Link href="/" className="brand">
          <Image src={logoId ? `/api/media/${logoId}` : "/placeholder-logo.svg"} alt="" width={38} height={38} priority />
          <span>{siteName}</span>
        </Link>
        <button
          ref={menuButtonRef}
          className="site-header__menu-toggle"
          type="button"
          aria-controls="public-navigation-panel"
          aria-expanded={menuOpen}
          aria-label={t("shell.openNavigation")}
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
        {menuOpen ? (
          <button
            className="site-header__backdrop"
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}
        <div
          ref={navigationPanelRef}
          id="public-navigation-panel"
          className={`site-header__nav${menuOpen ? " is-open" : ""}`}
          role={menuOpen ? "dialog" : undefined}
          aria-modal={menuOpen ? true : undefined}
          aria-label={menuOpen ? t("shell.primaryNavigation") : undefined}
        >
          <div className="site-header__drawer-head">
            <strong>{siteName}</strong>
            <button
              ref={closeButtonRef}
              className="site-header__menu-close"
              type="button"
              aria-label={t("shell.closeNavigation")}
              onClick={() => setMenuOpen(false)}
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
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
