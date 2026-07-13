import { lookup } from "dns/promises";
import { isIP } from "net";

type LookupAddress = { address: string; family: number };
type HostLookup = (hostname: string) => Promise<LookupAddress[]>;

const defaultLookup: HostLookup = (hostname) => lookup(hostname, { all: true, verbatim: true });

export async function resolvePublicHost(host: string, resolve: HostLookup = defaultLookup) {
  const hostname = normalizeHostname(host);
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await resolve(hostname);

  if (!addresses.length || addresses.some(({ address }) => !isPublicIpAddress(address))) {
    throw new Error("Mail server host must resolve only to public IP addresses.");
  }

  return { hostname, ...addresses[0] };
}

export function isPublicIpAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return isPublicIpv4(address);
  if (version !== 6) return false;

  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return isPublicIpv4(mappedIpv4);

  const [firstPart = "0", secondPart = "0"] = normalized.split(":");
  const first = Number.parseInt(firstPart || "0", 16);
  const second = Number.parseInt(secondPart || "0", 16);
  if (first < 0x2000 || first > 0x3fff) return false;
  if ((first === 0x2001 && (second === 0 || second === 0xdb8)) || first === 0x2002) return false;
  return true;
}

function normalizeHostname(host: string) {
  const hostname = host.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Mail server host must be a public hostname or IP address.");
  }
  return hostname;
}

function isPublicIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [a, b, c] = octets;

  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}
