// SSRF guard for the scanner. We fetch arbitrary, user-supplied URLs, so a
// hostile user could point us at internal infrastructure (cloud metadata,
// localhost, private RFC1918 ranges) and use ShipSafe as a blind SSRF proxy.
//
// Defense: before every outbound request (and on every redirect hop) we
// resolve the target host and reject if ANY resolved address — or the literal
// host, if it's an IP — is non-public. This closes the "scan http://169.254.
// 169.254/" class of abuse.
//
// Residual risk: DNS rebinding (host resolves public here, private at connect
// time) is not fully closed without pinning the connection to the validated
// IP; the pre-resolution below plus per-hop revalidation covers the realistic
// cases for a single-instance deployment. Documented on purpose.

import { lookup } from "node:dns/promises";
import net from "node:net";

/** True if an IPv4 literal falls in a non-public / reserved range. */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // malformed → treat as unsafe
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8 "this host"
  if (a === 10) return true; // 10.0.0.0/8 private
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0.0/24 IETF
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 benchmark
  if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved
  return false;
}

/** True if an IPv6 literal is loopback / link-local / unique-local / mapped-private. */
function isPrivateIPv6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0]; // strip zone id
  if (addr === "::1" || addr === "::") return true; // loopback / unspecified
  // IPv4-mapped (::ffff:a.b.c.d) → validate the embedded v4.
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (addr.startsWith("fe80")) return true; // link-local
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // fc00::/7 unique-local
  const first = addr.split(":")[0];
  if (first && first.startsWith("ff")) return true; // ff00::/8 multicast
  return false;
}

/** True if a raw IP string (v4 or v6) is non-public. */
export function isPrivateIP(ip: string): boolean {
  const type = net.isIP(ip);
  if (type === 4) return isPrivateIPv4(ip);
  if (type === 6) return isPrivateIPv6(ip);
  return true; // not a valid IP → unsafe
}

/**
 * Assert a URL is safe to fetch. Throws `Error("SSRF_BLOCKED: ...")` if the
 * host is an internal/private target. Resolves DNS and checks every address.
 */
export async function assertPublicUrl(rawUrl: string): Promise<void> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new Error("SSRF_BLOCKED: invalid url");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`SSRF_BLOCKED: protocol ${u.protocol}`);
  }
  const host = u.hostname.replace(/^\[|\]$/g, ""); // unwrap [ipv6]

  // Obvious hostnames that never resolve to public infra.
  const lower = host.toLowerCase();
  if (
    lower === "localhost" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".local") ||
    lower === "metadata.google.internal"
  ) {
    throw new Error(`SSRF_BLOCKED: internal host ${host}`);
  }

  // Literal IP: validate directly, no DNS.
  if (net.isIP(host)) {
    if (isPrivateIP(host)) throw new Error(`SSRF_BLOCKED: private ip ${host}`);
    return;
  }

  // Hostname: resolve all A/AAAA records; reject if any is private.
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    throw new Error(`SSRF_BLOCKED: dns resolution failed for ${host}`);
  }
  if (!addrs.length) throw new Error(`SSRF_BLOCKED: no dns records for ${host}`);
  for (const { address } of addrs) {
    if (isPrivateIP(address)) {
      throw new Error(`SSRF_BLOCKED: ${host} resolves to private ${address}`);
    }
  }
}
