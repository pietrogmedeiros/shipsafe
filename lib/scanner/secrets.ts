// Exposed-secret detection: regex battery over root HTML + combined JS.
// Every match is masked before it becomes evidence, and hits are deduped.

import type { RawFinding, Severity } from "../types";
import type { ScanContext } from "./context";
import { maskSecret } from "./fetch";

interface SupabaseInfo {
  supabaseUrl: string; // https://<ref>.supabase.co
  anonKey: string; // the anon JWT
  serviceKeyExposed: boolean; // did we also see a service_role key?
}

interface DecodedJwt {
  role?: string;
  iss?: string;
  ref?: string;
  [k: string]: unknown;
}

/**
 * Decode a JWT payload (middle segment) WITHOUT verifying the signature.
 * We only read claims (role, ref, iss) to classify Supabase keys.
 */
function decodeJwtPayload(jwt: string): DecodedJwt | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Pad to a multiple of 4 for base64.
    while (b64.length % 4 !== 0) b64 += "=";
    const json = Buffer.from(b64, "base64").toString("utf-8");
    const obj = JSON.parse(json);
    if (obj && typeof obj === "object") return obj as DecodedJwt;
    return null;
  } catch {
    return null;
  }
}

/**
 * Pull the Supabase project URL + anon key out of the scan context, if present.
 * Used by the RLS check. Returns null when the app isn't a Supabase app.
 */
export function extractSupabase(ctx: ScanContext): SupabaseInfo | null {
  const hay = `${ctx.rootHtml}\n${ctx.combinedJs}`;

  // Find a supabase project URL.
  const urlMatch = /https?:\/\/([a-z0-9]{16,40})\.supabase\.co/i.exec(hay);
  const supabaseUrl = urlMatch
    ? `https://${urlMatch[1].toLowerCase()}.supabase.co`
    : null;

  // Collect JWTs and classify them.
  let anonKey: string | null = null;
  let serviceKeyExposed = false;
  const jwtRe = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
  let jm: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((jm = jwtRe.exec(hay)) !== null) {
    const token = jm[0];
    if (seen.has(token)) continue;
    seen.add(token);
    const payload = decodeJwtPayload(token);
    if (!payload) continue;
    const isSupabaseIssuer =
      typeof payload.iss === "string" && /supabase/i.test(payload.iss);
    const hasRef = typeof payload.ref === "string";
    if (!isSupabaseIssuer && !hasRef) continue;
    if (payload.role === "anon" && !anonKey) anonKey = token;
    if (payload.role === "service_role") serviceKeyExposed = true;
  }

  if (!supabaseUrl && !anonKey) return null;
  if (!supabaseUrl || !anonKey) {
    // We have one half only; RLS probe needs both, but still return what we
    // can so the caller can decide. Require both for a usable probe target.
    return supabaseUrl && anonKey
      ? { supabaseUrl, anonKey, serviceKeyExposed }
      : null;
  }
  return { supabaseUrl, anonKey, serviceKeyExposed };
}

interface Rule {
  category: RawFinding["category"];
  title: string;
  severity: Severity;
  detail: string;
  remediation: string;
  regex: RegExp;
  // Optional post-filter on the captured value.
  accept?: (value: string) => boolean;
}

// The credential regex battery. `g` flags so we can iterate all matches.
const RULES: Rule[] = [
  {
    category: "exposed-secret",
    title: "Chave privada exposta no código",
    severity: "critical",
    detail:
      "Um bloco de chave privada (RSA/EC/PGP/OpenSSH) foi encontrado no código enviado ao navegador. Qualquer pessoa pode copiá-la.",
    remediation:
      "Remova a chave do frontend imediatamente, rotacione-a (gere uma nova) e mantenha chaves privadas apenas no servidor / variáveis de ambiente.",
    regex:
      /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
  {
    category: "exposed-secret",
    title: "Stripe secret key (LIVE) exposta",
    severity: "critical",
    detail:
      "Uma chave secreta de produção do Stripe está no código do frontend. Ela permite criar cobranças e mover dinheiro na sua conta.",
    remediation:
      "Revogue a chave no dashboard do Stripe agora, gere uma nova e use-a somente no backend. No frontend use apenas a publishable key (pk_).",
    regex: /\b(?:sk|rk)_live_[0-9a-zA-Z]{20,}\b/g,
  },
  {
    category: "exposed-secret",
    title: "Stripe publishable key (LIVE)",
    severity: "info",
    detail:
      "Chave publicável de produção do Stripe encontrada. É projetada para ser pública, mas confirma que você está em produção.",
    remediation:
      "Nenhuma ação urgente: pk_live_ é pública por design. Apenas garanta que a secret key (sk_live_) NÃO esteja no frontend.",
    regex: /\bpk_live_[0-9a-zA-Z]{20,}\b/g,
  },
  {
    category: "exposed-secret",
    title: "OpenAI API key exposta",
    severity: "critical",
    detail:
      "Uma API key da OpenAI está no código do frontend. Ela pode ser usada para gastar créditos da sua conta.",
    remediation:
      "Revogue a key em platform.openai.com, gere outra e faça chamadas à OpenAI somente pelo backend (nunca do navegador).",
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
    // Exclude Stripe (sk_live handled above) — this pattern is sk-... not sk_...
    accept: (v) => v.startsWith("sk-"),
  },
  {
    category: "exposed-secret",
    title: "Anthropic API key exposta",
    severity: "critical",
    detail:
      "Uma API key da Anthropic (Claude) está no frontend e pode ser usada para gastar créditos da sua conta.",
    remediation:
      "Revogue a key no console da Anthropic, gere outra e chame a API somente pelo backend.",
    regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    category: "exposed-secret",
    title: "AWS access key ID exposta",
    severity: "high",
    detail:
      "Um AWS Access Key ID foi encontrado. Se a secret access key também vazou, sua conta AWS está comprometida.",
    remediation:
      "Desative a chave no IAM, rotacione-a e nunca coloque credenciais AWS no frontend; use roles / backend.",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    category: "exposed-secret",
    title: "GitHub token exposto",
    severity: "critical",
    detail:
      "Um token de acesso do GitHub está no frontend. Ele pode dar acesso aos seus repositórios.",
    remediation:
      "Revogue o token nas configurações do GitHub, gere outro com escopo mínimo e mantenha-o apenas no backend/CI.",
    regex: /\b(?:ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{22,})\b/g,
  },
  {
    category: "exposed-secret",
    title: "SendGrid API key exposta",
    severity: "high",
    detail:
      "Uma API key do SendGrid foi encontrada. Ela permite enviar e-mails em seu nome (spam/phishing).",
    remediation:
      "Revogue a key no painel do SendGrid, gere outra e envie e-mails apenas pelo backend.",
    regex: /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    category: "exposed-secret",
    title: "Google / Firebase API key",
    severity: "low",
    detail:
      "Uma API key do Google (formato AIza...) foi encontrada — comum em configs do Firebase. Costuma ser pública, mas deve ser restrita por domínio/uso.",
    remediation:
      "No Google Cloud Console, restrinja a key por referrer HTTP e por APIs permitidas. Para Firebase, garanta que as Security Rules estejam corretas — a key sozinha não é o risco, as rules são.",
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
];

export function checkSecrets(ctx: ScanContext): RawFinding[] {
  const findings: RawFinding[] = [];
  const seen = new Set<string>(); // dedupe key: category|maskedValue

  const sources: { text: string; label: string }[] = [
    { text: ctx.rootHtml, label: ctx.url },
    ...ctx.bundles.map((b) => ({ text: b.text, label: b.url })),
  ];

  for (const rule of RULES) {
    for (const src of sources) {
      const re = new RegExp(rule.regex.source, rule.regex.flags);
      let m: RegExpExecArray | null;
      while ((m = re.exec(src.text)) !== null) {
        const value = m[0];
        if (rule.accept && !rule.accept(value)) continue;
        const masked = maskSecret(value);
        const dedupeKey = `${rule.category}|${rule.title}|${masked}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        findings.push({
          severity: rule.severity,
          category: rule.category,
          title: rule.title,
          detail: rule.detail,
          evidence: `${masked} — encontrado em ${src.label}`,
          remediation: rule.remediation,
          location: src.label,
        });
      }
    }
  }

  // Supabase JWTs: classify anon vs service_role via the decoded payload.
  const jwtRe =
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
  const jwtSeen = new Set<string>();
  for (const src of sources) {
    let m: RegExpExecArray | null;
    const re = new RegExp(jwtRe.source, jwtRe.flags);
    while ((m = re.exec(src.text)) !== null) {
      const token = m[0];
      if (jwtSeen.has(token)) continue;
      jwtSeen.add(token);
      const payload = decodeJwtPayload(token);
      if (!payload) continue;
      const isSupabase =
        (typeof payload.iss === "string" && /supabase/i.test(payload.iss)) ||
        typeof payload.ref === "string";
      if (!isSupabase) continue;
      const role = typeof payload.role === "string" ? payload.role : "unknown";
      const masked = maskSecret(token);

      if (role === "service_role") {
        findings.push({
          severity: "critical",
          category: "exposed-secret",
          title: "Supabase service_role key exposta",
          detail:
            "A chave service_role do Supabase está no frontend. Ela IGNORA todas as regras de segurança (RLS) e dá acesso TOTAL ao banco de dados — leitura, escrita e exclusão de qualquer dado.",
          evidence: `role=service_role JWT ${masked} — em ${src.label}`,
          remediation:
            "Remova a chave do frontend AGORA, rotacione as chaves de API do projeto no painel do Supabase (Settings > API) e use service_role apenas no backend/edge functions.",
          location: src.label,
        });
      } else if (role === "anon") {
        findings.push({
          severity: "low",
          category: "exposed-secret",
          title: "Supabase anon key presente (esperado)",
          detail:
            "A chave anon (pública) do Supabase está no frontend. Isso é normal e esperado — ela é feita para ser pública. O RISCO REAL é se o RLS (Row Level Security) estiver desligado nas tabelas. Veja o check de RLS.",
          evidence: `role=anon JWT ${masked} — em ${src.label}`,
          remediation:
            "Não precisa esconder a anon key. Garanta que TODAS as tabelas tenham RLS habilitado com políticas corretas (o scanner testa isso automaticamente).",
          location: src.label,
        });
      }
    }
  }

  return findings;
}
