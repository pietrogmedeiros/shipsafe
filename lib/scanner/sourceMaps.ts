// Detect published source maps. If a bundle references a .map and that .map is
// reachable, the original (pre-minified) source code is downloadable — which
// often reveals internal logic, comments, and sometimes secrets.

import type { RawFinding } from "../types";
import type { ScanContext } from "./context";
import { safeFetch } from "./fetch";

const PROBE_TIMEOUT_MS = 6_000;
const PROBE_CONCURRENCY = 3;
const MAP_MAX_BYTES = 1_500_000;

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

export async function checkSourceMaps(
  ctx: ScanContext,
): Promise<RawFinding[]> {
  // Collect (bundleUrl, mapUrl) pairs from sourceMappingURL comments.
  const targets: { bundleUrl: string; mapUrl: string }[] = [];
  const seenMap = new Set<string>();

  const smRe = /\/\/[#@]\s*sourceMappingURL\s*=\s*(\S+)/g;
  for (const bundle of ctx.bundles) {
    let m: RegExpExecArray | null;
    const re = new RegExp(smRe.source, smRe.flags);
    while ((m = re.exec(bundle.text)) !== null) {
      const ref = m[1].trim();
      if (ref.startsWith("data:")) continue; // inline map, not a separate fetch
      let mapUrl: string;
      try {
        mapUrl = new URL(ref, bundle.url).toString();
      } catch {
        continue;
      }
      if (seenMap.has(mapUrl)) continue;
      seenMap.add(mapUrl);
      targets.push({ bundleUrl: bundle.url, mapUrl });
    }
  }

  if (targets.length === 0) return [];

  const results = await mapLimit(
    targets,
    PROBE_CONCURRENCY,
    async ({ bundleUrl, mapUrl }): Promise<RawFinding | null> => {
      const res = await safeFetch(mapUrl, {
        timeoutMs: PROBE_TIMEOUT_MS,
        maxBytes: MAP_MAX_BYTES,
      });
      if (!res.ok || res.status !== 200) return null;

      // Confirm it's really a source map, not a 200 fallback page.
      let hasSourcesContent = false;
      let looksLikeMap = false;
      try {
        const j = JSON.parse(res.text);
        if (j && typeof j === "object" && ("version" in j || "mappings" in j)) {
          looksLikeMap = true;
          hasSourcesContent =
            Array.isArray((j as { sourcesContent?: unknown }).sourcesContent) &&
            (j as { sourcesContent: unknown[] }).sourcesContent.length > 0;
        }
      } catch {
        // Truncated large map still counts if header/prefix looks right.
        looksLikeMap =
          /"version"\s*:/.test(res.text) && /"mappings"\s*:/.test(res.text);
        hasSourcesContent = /"sourcesContent"\s*:\s*\[/.test(res.text);
      }
      if (!looksLikeMap) return null;

      return {
        severity: "medium",
        category: "source-map",
        title: "Source map exposto (código-fonte legível)",
        detail:
          "Um source map (.map) está acessível publicamente. Ele permite reconstruir o código-fonte original (não minificado)" +
          (hasSourcesContent
            ? ", INCLUINDO o conteúdo completo dos arquivos ('sourcesContent' presente)."
            : ", revelando nomes de variáveis e a estrutura do código.") +
          " Isso facilita encontrar falhas e às vezes expõe segredos deixados no código.",
        evidence: `GET ${mapUrl} → 200${
          hasSourcesContent ? " (sourcesContent presente)" : ""
        }; referenciado por ${bundleUrl}`,
        remediation:
          "Desligue a geração/publicação de source maps em produção (ex.: no Vite/Next configure para não emitir .map público) ou bloqueie o acesso aos arquivos .map no servidor/CDN.",
        location: mapUrl,
      };
    },
  );

  return results.filter((r): r is RawFinding => r !== null);
}
