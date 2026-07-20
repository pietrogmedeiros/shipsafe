// Low-level HTTP helpers for the scanner.
// We fetch hostile / arbitrary remote URLs here, so EVERYTHING is bounded:
// hard timeouts (AbortController), a response size cap, an SSRF guard on the
// target (and on every redirect hop), and we never throw.

import { assertPublicUrl } from "./ssrf";

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 2_500_000; // ~2.5MB cap per response
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 ShipSafe-Scanner/1.0";

export interface SafeFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxBytes?: number;
  // If true, we still read the body but stop after maxBytes (default true).
  readBody?: boolean;
}

export interface SafeFetchResult {
  ok: boolean; // network-level ok (a response was received), NOT status 2xx
  status: number; // 0 when no response (network error / timeout)
  headers: Record<string, string>;
  text: string; // possibly truncated to maxBytes
  truncated: boolean;
  url: string; // final URL after redirects (or the requested url)
  error: string | null;
}

/**
 * Fetch a URL without ever throwing. Enforces a hard timeout and a body size
 * cap by streaming the response and aborting once the cap is exceeded.
 */
export async function safeFetch(
  url: string,
  opts: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const {
    method = "GET",
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    readBody = true,
  } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const empty = (error: string | null): SafeFetchResult => ({
    ok: false,
    status: 0,
    headers: {},
    text: "",
    truncated: false,
    url,
    error,
  });

  try {
    // Manual redirect handling so we can re-validate every hop against the
    // SSRF guard — otherwise a public host could 3xx us to an internal target.
    let currentUrl = url;
    let res: Response;
    let hops = 0;
    while (true) {
      await assertPublicUrl(currentUrl);
      res = await fetch(currentUrl, {
        method,
        headers: { "User-Agent": USER_AGENT, ...headers },
        signal: controller.signal,
        redirect: "manual",
      });
      const isRedirect = res.status >= 300 && res.status < 400;
      const location = res.headers.get("location");
      if (!isRedirect || !location) break;
      if (++hops > MAX_REDIRECTS) {
        return empty(`too many redirects (>${MAX_REDIRECTS})`);
      }
      // Drain the redirect body so the connection is released.
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        return empty(`invalid redirect location: ${location}`);
      }
    }

    const resHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      resHeaders[key.toLowerCase()] = value;
    });

    let text = "";
    let truncated = false;

    if (readBody && res.body) {
      // Stream and enforce the byte cap so a huge/hostile body can't blow memory.
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8", { fatal: false });
      let received = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          received += value.byteLength;
          if (received > maxBytes) {
            // Decode only up to the cap, then stop.
            const remaining = value.byteLength - (received - maxBytes);
            if (remaining > 0) {
              text += decoder.decode(value.subarray(0, remaining), {
                stream: true,
              });
            }
            truncated = true;
            break;
          }
          text += decoder.decode(value, { stream: true });
        }
      } finally {
        // Ensure the underlying connection is released.
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
      }
      text += decoder.decode();
    } else if (readBody) {
      // No stream body available (rare); fall back to text() with cap.
      const raw = await res.text();
      if (raw.length > maxBytes) {
        text = raw.slice(0, maxBytes);
        truncated = true;
      } else {
        text = raw;
      }
    }

    return {
      ok: true,
      status: res.status,
      headers: resHeaders,
      text,
      truncated,
      url: res.url || currentUrl,
      error: null,
    };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? `timeout after ${timeoutMs}ms`
          : err.message
        : String(err);
    return empty(msg);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse `<script src>` tags and JS module preloads from an HTML document and
 * resolve them to absolute URLs. Returns only same-ish JS bundle candidates.
 */
export function discoverBundles(
  html: string,
  baseUrl: string,
  cap = 12,
): string[] {
  const found = new Set<string>();

  const push = (raw: string | undefined | null) => {
    if (!raw) return;
    const src = raw.trim();
    if (!src) return;
    // Skip data URIs and obvious non-JS.
    if (src.startsWith("data:")) return;
    let abs: string;
    try {
      abs = new URL(src, baseUrl).toString();
    } catch {
      return;
    }
    // Only keep http(s).
    if (!/^https?:\/\//i.test(abs)) return;
    found.add(abs);
  };

  // <script ... src="...">
  const scriptRe = /<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(html)) !== null) {
    push(m[2]);
  }

  // <link rel="modulepreload" href="..."> and rel="preload" as="script"
  const linkRe = /<link\b[^>]*>/gi;
  while ((m = linkRe.exec(html)) !== null) {
    const tag = m[0];
    if (/rel\s*=\s*["']?\s*modulepreload/i.test(tag)) {
      const href = /\bhref\s*=\s*(["'])(.*?)\1/i.exec(tag);
      push(href?.[2]);
    } else if (
      /rel\s*=\s*["']?\s*preload/i.test(tag) &&
      /\bas\s*=\s*["']?\s*script/i.test(tag)
    ) {
      const href = /\bhref\s*=\s*(["'])(.*?)\1/i.exec(tag);
      push(href?.[2]);
    }
  }

  // Prefer things that actually look like JS bundles, but keep others too.
  const all = [...found];
  const jsLike = all.filter((u) => /\.(m?js)(\?|#|$)/i.test(u));
  const rest = all.filter((u) => !jsLike.includes(u));
  return [...jsLike, ...rest].slice(0, cap);
}

/** Mask a secret for evidence: show first 6 + last 4 chars only. */
export function maskSecret(secret: string): string {
  const s = secret.trim();
  if (s.length <= 12) {
    // Too short to safely show both ends; reveal at most the first 2 chars.
    const head = s.slice(0, 2);
    return `${head}${"*".repeat(Math.max(s.length - 2, 0))}`;
  }
  return `${s.slice(0, 6)}...${s.slice(-4)} (len=${s.length})`;
}
