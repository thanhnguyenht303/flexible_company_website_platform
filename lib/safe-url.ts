export function isSafePublicUrl(value: string) {
  if (!value) return true;

  if (value.startsWith("/")) {
    return !value.startsWith("//") && !/[\r\n]/.test(value);
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
