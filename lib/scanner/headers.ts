// Inspect the root response headers for missing/weak security controls.
// Pure sync check — everything it needs is already in ctx.rootHeaders.

import type { RawFinding } from "../types";
import type { ScanContext } from "./context";

export function checkHeaders(ctx: ScanContext): RawFinding[] {
  const findings: RawFinding[] = [];
  const h = ctx.rootHeaders;

  // If the root fetch never succeeded, there's nothing meaningful to inspect.
  if (ctx.rootStatus === 0 && Object.keys(h).length === 0) return findings;

  const isHttps = ctx.origin.startsWith("https://");
  const csp = h["content-security-policy"] || "";
  const has = (name: string) => typeof h[name] === "string" && h[name] !== "";

  const loc = ctx.url;

  // Content-Security-Policy
  if (!csp) {
    findings.push({
      severity: "medium",
      category: "security-header",
      title: "Sem Content-Security-Policy (CSP)",
      detail:
        "Não há cabeçalho CSP. CSP é a principal defesa contra XSS (injeção de scripts maliciosos) — sem ele, um script injetado roda livremente.",
      evidence: "Resposta não inclui o header 'content-security-policy'.",
      remediation:
        "Adicione um cabeçalho Content-Security-Policy começando restritivo (ex.: \"default-src 'self'\") e ajuste conforme necessário.",
      location: loc,
    });
  }

  // Strict-Transport-Security (only meaningful on https)
  if (isHttps && !has("strict-transport-security")) {
    findings.push({
      severity: "medium",
      category: "security-header",
      title: "Sem HSTS (Strict-Transport-Security)",
      detail:
        "Sem HSTS, um atacante em rede insegura pode forçar o navegador a usar HTTP e interceptar o tráfego.",
      evidence: "Resposta HTTPS não inclui 'strict-transport-security'.",
      remediation:
        "Adicione: Strict-Transport-Security: max-age=31536000; includeSubDomains (após confirmar que todo o site funciona em HTTPS).",
      location: loc,
    });
  }

  // Clickjacking: X-Frame-Options OR CSP frame-ancestors
  const hasFrameAncestors = /frame-ancestors/i.test(csp);
  if (!has("x-frame-options") && !hasFrameAncestors) {
    findings.push({
      severity: "medium",
      category: "security-header",
      title: "Sem proteção contra clickjacking",
      detail:
        "Sem X-Frame-Options nem 'frame-ancestors' no CSP, seu site pode ser embutido em um iframe malicioso para enganar usuários (clickjacking).",
      evidence:
        "Nenhum de 'x-frame-options' ou CSP 'frame-ancestors' está presente.",
      remediation:
        "Adicione 'X-Frame-Options: DENY' (ou SAMEORIGIN) ou inclua 'frame-ancestors' no seu CSP.",
      location: loc,
    });
  }

  // X-Content-Type-Options: nosniff
  const xcto = (h["x-content-type-options"] || "").toLowerCase();
  if (!xcto.includes("nosniff")) {
    findings.push({
      severity: "low",
      category: "security-header",
      title: "Sem X-Content-Type-Options: nosniff",
      detail:
        "Sem 'nosniff', o navegador pode adivinhar o tipo de um arquivo e executá-lo como script, abrindo espaço para ataques.",
      evidence: "Header 'x-content-type-options: nosniff' ausente.",
      remediation: "Adicione: X-Content-Type-Options: nosniff.",
      location: loc,
    });
  }

  // Referrer-Policy
  if (!has("referrer-policy")) {
    findings.push({
      severity: "low",
      category: "security-header",
      title: "Sem Referrer-Policy",
      detail:
        "Sem uma política de referrer, o navegador pode vazar URLs internas (com tokens) para sites de terceiros no header Referer.",
      evidence: "Header 'referrer-policy' ausente.",
      remediation:
        "Adicione: Referrer-Policy: strict-origin-when-cross-origin (ou no-referrer).",
      location: loc,
    });
  }

  // Version disclosure via Server / X-Powered-By
  const disclosers: string[] = [];
  const server = h["server"];
  const powered = h["x-powered-by"];
  // Only flag Server when it reveals a version number, to avoid noise on
  // generic values like "cloudflare".
  if (server && /\d/.test(server)) disclosers.push(`Server: ${server}`);
  if (powered) disclosers.push(`X-Powered-By: ${powered}`);
  if (disclosers.length) {
    findings.push({
      severity: "info",
      category: "info-leak",
      title: "Divulgação de versão de software",
      detail:
        "Cabeçalhos de resposta revelam o software/servidor e versão, ajudando um atacante a procurar vulnerabilidades conhecidas.",
      evidence: disclosers.join(" | "),
      remediation:
        "Remova ou ofusque os cabeçalhos 'Server' e 'X-Powered-By' na configuração do servidor/proxy.",
      location: loc,
    });
  }

  return findings;
}
