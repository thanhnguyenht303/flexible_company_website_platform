import Image from "next/image";
import Link from "next/link";

type PublicHeaderProps = {
  siteName: string;
};

const navItems = [
  ["About", "/about"],
  ["Services", "/services"],
  ["Products", "/products"],
  ["Team", "/team"],
  ["Blog", "/blog"],
  ["Contact", "/contact"]
];

export function PublicHeader({ siteName }: PublicHeaderProps) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand">
          <Image src="/placeholder-logo.svg" alt="" width={38} height={38} priority />
          <span>{siteName}</span>
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {navItems.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
