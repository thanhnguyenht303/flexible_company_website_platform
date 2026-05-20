export function buildTitle(title: string | null | undefined, siteName: string): string {
  if (!title) return siteName;
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
}
