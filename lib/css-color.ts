const hexColorPattern = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const safeColorKeywords = new Set(["transparent", "inherit", "currentcolor"]);

/** Return the configured foreground when it is readable, otherwise choose black or white. */
export function ensureReadableHexColor(foreground: string, background: string, minimumRatio = 4.5) {
  const foregroundRgb = parseSixDigitHex(foreground);
  const backgroundRgb = parseSixDigitHex(background);
  if (!foregroundRgb || !backgroundRgb) return foreground;
  if (contrastRatio(foregroundRgb, backgroundRgb) >= minimumRatio) return foreground;

  const black = { red: 0, green: 0, blue: 0 };
  const white = { red: 255, green: 255, blue: 255 };
  return contrastRatio(white, backgroundRgb) >= contrastRatio(black, backgroundRgb) ? "#FFFFFF" : "#000000";
}

/** Accept supported CSS colors without allowing declarations, URLs, or variables. */
export function isSafeCssColor(value: string, options: { allowInherited?: boolean } = {}) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 80) return false;

  if (hexColorPattern.test(normalized) || isValidFunctionalColor(normalized)) return true;
  if (!safeColorKeywords.has(normalized.toLowerCase())) return false;

  return options.allowInherited !== false;
}

function isValidFunctionalColor(value: string) {
  const match = value.match(/^(rgb|rgba|hsl|hsla)\((.*)\)$/i);
  if (!match) return false;

  const functionName = match[1].toLowerCase();
  const body = match[2].trim();
  if (!body || !/^[-+\d.%\s,/a-z]+$/i.test(body)) return false;

  const commaSyntax = body.includes(",");
  if (commaSyntax && body.includes("/")) return false;

  const slashParts = body.split("/").map((part) => part.trim());
  if (slashParts.length > 2) return false;

  const rawComponents = commaSyntax ? slashParts[0].split(",") : slashParts[0].split(/\s+/);
  const components = rawComponents.map((part) => part.trim()).filter(Boolean);
  let alpha: string | undefined = slashParts[1];

  if (commaSyntax && (functionName === "rgba" || functionName === "hsla")) alpha = components.pop();
  if (components.length !== 3) return false;
  if ((functionName === "rgba" || functionName === "hsla") && alpha === undefined) return false;
  if (alpha !== undefined && !isAlpha(alpha)) return false;

  return functionName.startsWith("rgb")
    ? components.every(isRgbChannel)
    : isHue(components[0] ?? "") && components.slice(1).every(isPercentage);
}

function isRgbChannel(value: string) {
  return value.endsWith("%") ? isPercentage(value) : isNumberInRange(value, 0, 255);
}

function isAlpha(value: string) {
  return value.endsWith("%") ? isPercentage(value) : isNumberInRange(value, 0, 1);
}

function isPercentage(value: string) {
  return value.endsWith("%") && isNumberInRange(value.slice(0, -1), 0, 100);
}

function isHue(value: string) {
  const match = value.match(/^([-+]?(?:\d+\.?\d*|\.\d+))(deg|grad|rad|turn)?$/i);
  return Boolean(match && Number.isFinite(Number(match[1])));
}

function isNumberInRange(value: string, min: number, max: number) {
  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value)) return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function parseSixDigitHex(value: string) {
  const match = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return {
    red: Number.parseInt(match[1], 16),
    green: Number.parseInt(match[2], 16),
    blue: Number.parseInt(match[3], 16)
  };
}

function contrastRatio(first: { red: number; green: number; blue: number }, second: { red: number; green: number; blue: number }) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: { red: number; green: number; blue: number }) {
  const channels = [color.red, color.green, color.blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
