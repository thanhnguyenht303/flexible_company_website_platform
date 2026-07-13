export function SkipLink({ href = "#main-content", children }: { href?: string; children: React.ReactNode }) {
  return (
    <a className="skip-link" href={href}>
      {children}
    </a>
  );
}
