"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Scan, Finding, Severity } from "@/lib/types";
import { GradeBadge } from "./GradeBadge";
import { Mascot, moodForScan } from "./Mascot";
import { BlockyLoader } from "./BlockyLoader";
import { SeverityChip } from "./SeverityChip";
import {
  CATEGORY_LABEL,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
  SEVERITY_STYLE,
  timeAgo,
} from "./severity";

export function ScanReport({ id, isPro }: { id: string; isPro: boolean }) {
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchScan = useCallback(async () => {
    try {
      const res = await fetch(`/api/scans/${id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setError("Scan não encontrado.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError("Não foi possível carregar o relatório.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setScan(data.scan);
      setFindings(data.findings ?? []);
      setLoading(false);

      // Keep polling while the scan is still running.
      if (data.scan?.status === "running" || data.scan?.status === "queued") {
        pollRef.current = setTimeout(fetchScan, 2000);
      }
    } catch {
      setError("Erro de conexão.");
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchScan();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchScan]);

  if (loading) {
    return (
      <div className="py-20">
        <BlockyLoader label="Carregando relatório…" />
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
        <p className="text-sm text-red-300">{error ?? "Erro."}</p>
        <Link
          href="/app"
          className="mt-4 inline-block text-sm text-brand-soft hover:underline"
        >
          ← Voltar ao painel
        </Link>
      </div>
    );
  }

  const running = scan.status === "running" || scan.status === "queued";
  const failed = scan.status === "failed";

  const grouped = SEVERITY_ORDER.map((sev) => ({
    sev,
    items: findings.filter((f) => f.severity === sev),
  })).filter((g) => g.items.length > 0);

  const criticalCount = scan.counts?.critical ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {!running && !failed && isPro && (
        <div className="flex justify-end">
          <a
            href={`/report/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-3.5 py-2 text-sm font-medium text-brand-soft transition hover:bg-brand/20"
          >
            ⬇ Exportar PDF
          </a>
        </div>
      )}
      {/* Header / summary */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-surface p-6 sm:p-8 ${
          criticalCount > 0
            ? "border-red-500/30"
            : failed
              ? "border-border"
              : "border-amber-500/20"
        }`}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            {running ? (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-border bg-bg">
                <span className="h-8 w-8 rounded-full border-2 border-brand/30 border-t-brand animate-ss-spin" />
              </div>
            ) : (
              <GradeBadge grade={scan.grade} size="lg" glow />
            )}
            <div>
              <p className="font-mono text-xs text-faint">alvo</p>
              <a
                href={scan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all font-mono text-sm text-ink hover:text-brand-soft"
              >
                {scan.url}
              </a>
              <p className="mt-2 text-xs text-faint">
                {running
                  ? "escaneando agora…"
                  : failed
                    ? "scan falhou"
                    : `concluído ${timeAgo(scan.finishedAt ?? scan.startedAt)}`}
              </p>
            </div>
          </div>

          <div className="sm:ml-auto">
            {!running && !failed && (
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <Mascot
                  mood={moodForScan(scan.grade, criticalCount)}
                  size={96}
                />
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-ink">
                    {scan.score ?? "—"}
                  </span>
                  <span className="text-sm text-faint">/ 100</span>
                </div>
                <CountRow counts={scan.counts} />
              </div>
            )}
          </div>
        </div>

        {running && (
          <p className="mt-6 text-sm text-muted">
            Estamos sondando seu app a partir da internet. Isso costuma levar
            poucos segundos — a página atualiza sozinha.
          </p>
        )}
        {failed && (
          <p className="mt-6 text-sm text-red-300">
            {scan.error ?? "O scan não pôde ser concluído. Tente novamente."}
          </p>
        )}
      </div>

      {/* Findings */}
      {!running && !failed && (
        <>
          {findings.length === 0 ? (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-6 py-12 text-center">
              <div className="mx-auto flex justify-center">
                <Mascot mood="happy" size={120} />
              </div>
              <p className="mt-3 text-lg font-semibold text-amber-200">
                Nenhum vazamento crítico encontrado
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-amber-200/70">
                Seu app passou nas nossas verificações externas. Ative o
                monitoramento contínuo para ser avisado se algo mudar num
                próximo deploy.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {grouped.map((group) => (
                <section key={group.sev}>
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${SEVERITY_STYLE[group.sev].dot}`}
                    />
                    <h3 className="text-sm font-semibold text-ink">
                      {SEVERITY_LABEL[group.sev]}
                    </h3>
                    <span className="text-xs text-faint">
                      {group.items.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.items.map((f) => (
                      <FindingCard key={f.id} finding={f} isPro={isPro} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Footer / trust + upsell */}
          <div className="flex flex-col items-center gap-4 border-t border-border pt-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Secured by SafeShip
            </div>
            {!isPro && (
              <p className="text-sm text-muted">
                <Link
                  href="/app/upgrade"
                  className="font-medium text-brand-soft hover:underline"
                >
                  Faça upgrade para o Pro
                </Link>{" "}
                e tenha monitoramento contínuo, alerta a cada deploy, PDF e o
                selo de segurança.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CountRow({ counts }: { counts: Record<Severity, number> }) {
  const order: Severity[] = ["critical", "high", "medium", "low"];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {order.map((sev) => {
        const n = counts?.[sev] ?? 0;
        const s = SEVERITY_STYLE[sev];
        return (
          <span
            key={sev}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
              n > 0 ? s.chip : "bg-white/[0.03] text-faint ring-1 ring-inset ring-white/5"
            }`}
          >
            <span className="tabular-nums">{n}</span>
            {SEVERITY_LABEL[sev].toLowerCase()}
          </span>
        );
      })}
    </div>
  );
}

// A copy-paste prompt for an AI coding assistant (Claude / Codex / Cursor).
function buildFixPrompt(f: Finding): string {
  return `Você é um engenheiro de segurança sênior. Um scanner externo (SafeShip) encontrou esta vulnerabilidade no meu app já publicado:

Vulnerabilidade: ${f.title}
Severidade: ${SEVERITY_LABEL[f.severity]}
Categoria: ${CATEGORY_LABEL[f.category] ?? f.category}${f.location ? `\nOnde: ${f.location}` : ""}

O que é:
${f.detail}

Evidência (já redigida):
${f.evidence}

Correção recomendada:
${f.remediation}

Tarefa: implemente essa correção no meu código. Diga exatamente quais arquivos alterar, mostre o diff e explique como eu testo que o vazamento foi fechado. Não introduza regressões nem exponha novos segredos.`;
}

function FindingCard({
  finding,
  isPro,
}: {
  finding: Finding;
  isPro: boolean;
}) {
  const isCritical = finding.severity === "critical";
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={`rounded-xl border bg-surface p-4 sm:p-5 ${
        isCritical
          ? "border-red-500/40 shadow-[0_0_28px_-14px_rgba(239,68,68,0.6)]"
          : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityChip severity={finding.severity} />
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-muted ring-1 ring-inset ring-white/10">
          {CATEGORY_LABEL[finding.category] ?? finding.category}
        </span>
      </div>

      <h4 className="mt-3 text-[15px] font-semibold text-ink">
        {finding.title}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {finding.detail}
      </p>

      {finding.evidence && (
        <div className="mt-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-faint">
            Evidência
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border-soft bg-bg px-3 py-2.5 font-mono text-xs leading-relaxed text-amber-200/90">
            {finding.evidence}
          </pre>
        </div>
      )}

      {finding.location && (
        <p className="mt-2 truncate font-mono text-xs text-faint">
          {finding.location}
        </p>
      )}

      {finding.remediation && (
        <div className="mt-3 rounded-lg border border-brand/20 bg-brand/[0.05] px-3 py-2.5">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-brand-soft">
            Como corrigir
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-amber-100/80">
            {finding.remediation}
          </p>
          {isPro ? (
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(buildFixPrompt(finding));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                } catch {
                  /* clipboard blocked */
                }
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-soft transition hover:bg-brand/20"
            >
              {copied ? "Prompt copiado ✓" : "⌘ Copiar prompt pra IA (Claude/Codex)"}
            </button>
          ) : (
            <Link
              href="/app/upgrade"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-faint transition hover:text-brand-soft"
            >
              🔒 Prompt de correção pra IA — recurso Pro
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
