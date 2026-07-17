// Builds the shared ScanContext once so no check refetches anything.
// One root HTML fetch + bundle discovery + bounded-concurrency bundle fetch.

import { safeFetch, discoverBundles } from "./fetch";

export interface ScanBundle {
  url: string;
  text: string;
}

export interface ScanContext {
  url: string; // requested URL (normalized)
  origin: string; // scheme://host[:port]
  rootHtml: string; // root document HTML (possibly truncated)
  rootStatus: number; // status of the root fetch
  rootHeaders: Record<string, string>;
  bundles: ScanBundle[]; // fetched JS bundles
  combinedJs: string; // all bundle texts concatenated (for regex sweeps)
  errors: string[]; // non-fatal fetch problems, for debugging
}

const BUNDLE_CONCURRENCY = 4;
const BUNDLE_TIMEOUT_MS = 8_000;

/** Normalize a user-supplied URL: add https:// if scheme missing. */
function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Run tasks with a fixed concurrency limit. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = new Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (true) {
        const cur = idx++;
        if (cur >= items.length) break;
        results[cur] = await fn(items[cur]);
      }
    });
  await Promise.all(workers);
  return results;
}

export async function buildContext(rawUrl: string): Promise<ScanContext> {
  const url = normalizeUrl(rawUrl);
  const errors: string[] = [];

  let origin = url;
  try {
    origin = new URL(url).origin;
  } catch {
    /* keep url as origin fallback */
  }

  const root = await safeFetch(url, { timeoutMs: BUNDLE_TIMEOUT_MS });
  if (!root.ok) {
    errors.push(`root fetch failed: ${root.error}`);
  }

  const rootHtml = root.text;
  const bundleUrls = rootHtml ? discoverBundles(rootHtml, root.url || url) : [];

  const fetched = await mapLimit(
    bundleUrls,
    BUNDLE_CONCURRENCY,
    async (bUrl): Promise<ScanBundle | null> => {
      const res = await safeFetch(bUrl, { timeoutMs: BUNDLE_TIMEOUT_MS });
      if (!res.ok || res.status >= 400) {
        errors.push(
          `bundle fetch failed (${res.status || res.error}): ${bUrl}`,
        );
        return null;
      }
      return { url: bUrl, text: res.text };
    },
  );

  const bundles = fetched.filter((b): b is ScanBundle => b !== null);
  const combinedJs = bundles.map((b) => b.text).join("\n");

  return {
    url,
    origin,
    rootHtml,
    rootStatus: root.status,
    rootHeaders: root.headers,
    bundles,
    combinedJs,
    errors,
  };
}
