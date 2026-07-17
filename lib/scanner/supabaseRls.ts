// THE killer check: is Supabase Row Level Security actually protecting the DB?
// This is the class of bug behind CVE-2025-48757 / the Moltbook leak: an app
// ships the anon key (fine) but leaves RLS off, so the anon key can read whole
// tables directly from the REST API — no login required.

import type { RawFinding } from "../types";
import type { ScanContext } from "./context";
import { safeFetch } from "./fetch";
import { extractSupabase } from "./secrets";

// Common table names in vibe-coded apps. We probe read access on each.
const CANDIDATE_TABLES = [
  "users",
  "profiles",
  "todos",
  "messages",
  "posts",
  "orders",
  "customers",
  "payments",
];

const PROBE_TIMEOUT_MS = 6_000;
const PROBE_CONCURRENCY = 3;

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

export async function checkSupabaseRls(
  ctx: ScanContext,
): Promise<RawFinding[]> {
  const supa = extractSupabase(ctx);
  // No Supabase url+anon key found → nothing to probe. This path must be safe.
  if (!supa) return [];

  const { supabaseUrl, anonKey } = supa;
  const findings: RawFinding[] = [];

  const authHeaders = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: "application/json",
  };

  // Quick reachability sanity check on the REST root. If this fails we bail
  // gracefully (network issue / project paused) instead of flagging noise.
  const root = await safeFetch(
    `${supabaseUrl}/rest/v1/?apikey=${encodeURIComponent(anonKey)}`,
    { headers: authHeaders, timeoutMs: PROBE_TIMEOUT_MS },
  );
  if (!root.ok) {
    return []; // couldn't reach the API; don't guess.
  }

  const results = await mapLimit(
    CANDIDATE_TABLES,
    PROBE_CONCURRENCY,
    async (table): Promise<RawFinding | null> => {
      const probeUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(
        table,
      )}?select=*&limit=1`;
      const res = await safeFetch(probeUrl, {
        headers: authHeaders,
        timeoutMs: PROBE_TIMEOUT_MS,
      });
      if (!res.ok || res.status !== 200) return null;

      // A 200 with a JSON ARRAY means the anon role could read the table.
      // (RLS-protected tables return 200 [] only if a policy allows it; an
      //  empty array is ambiguous, so we grade by whether rows came back.)
      let parsed: unknown;
      try {
        parsed = JSON.parse(res.text);
      } catch {
        return null;
      }
      if (!Array.isArray(parsed)) return null;

      const rowCount = parsed.length;
      // Column names only — we deliberately do NOT include row values in evidence.
      const columns =
        rowCount > 0 && parsed[0] && typeof parsed[0] === "object"
          ? Object.keys(parsed[0] as Record<string, unknown>)
          : [];

      if (rowCount > 0) {
        // Data actually leaked out with just the public anon key.
        return {
          severity: "critical",
          category: "supabase-rls",
          title: `Tabela "${table}" do Supabase legível publicamente (RLS desligado)`,
          detail:
            `A tabela "${table}" pode ser lida por QUALQUER pessoa usando apenas a chave pública (anon), sem login. ` +
            "Isso significa que o Row Level Security (RLS) está desligado ou sem política. É exatamente a falha da CVE-2025-48757 (vazamento tipo Moltbook): dados de usuários expostos na internet.",
          evidence:
            `GET ${supabaseUrl}/rest/v1/${table}?select=*&limit=1 → 200, retornou ${rowCount}+ linha(s). ` +
            (columns.length
              ? `Colunas expostas: ${columns.join(", ")}. (valores omitidos)`
              : ""),
          remediation:
            `No painel do Supabase: Table Editor > "${table}" > habilite Row Level Security e crie políticas (ex.: permitir SELECT apenas em "user_id = auth.uid()"). ` +
            "Faça isso para TODAS as tabelas. Sem política, RLS habilitado bloqueia tudo por padrão — que é o comportamento seguro.",
          location: probeUrl,
        };
      }

      // 200 [] — accessible but empty. Could be an empty table OR a permissive
      // policy on empty data. We flag as HIGH (still a strong signal RLS may
      // be misconfigured / table publicly enumerable), without claiming a leak.
      return {
        severity: "high",
        category: "supabase-rls",
        title: `Tabela "${table}" do Supabase acessível via anon key`,
        detail:
          `A tabela "${table}" respondeu com sucesso (200) à chave pública anon, embora vazia no momento. ` +
          "Isso sugere que não há RLS bloqueando leituras anônimas: assim que houver dados, eles vazarão.",
        evidence: `GET ${supabaseUrl}/rest/v1/${table}?select=*&limit=1 → 200, [] (0 linhas)`,
        remediation:
          `Habilite RLS na tabela "${table}" e adicione políticas explícitas de acesso antes de inserir dados reais.`,
        location: probeUrl,
      };
    },
  );

  for (const r of results) if (r) findings.push(r);
  return findings;
}
