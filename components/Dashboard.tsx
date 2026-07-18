"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { App, Scan } from "@/lib/types";
import { GradeBadge } from "./GradeBadge";
import { timeAgo } from "./severity";

export function Dashboard({ isPro }: { isPro: boolean }) {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // new-scan form
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [planLimited, setPlanLimited] = useState(false);

  // per-app rescan state
  const [rescanId, setRescanId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/scans");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const data = await res.json();
      setApps(data.apps ?? []);
      setScans(data.scans ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function startScan(e: React.FormEvent) {
    e.preventDefault();
    const v = url.trim();
    if (!v) return;
    setSubmitting(true);
    setScanError(null);
    setPlanLimited(false);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: v, name: name.trim() || undefined }),
      });
      if (res.status === 402) {
        setPlanLimited(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setScanError(
          data.error === "invalid_url"
            ? "URL inválida. Verifique e tente de novo."
            : "Não foi possível iniciar o scan.",
        );
        return;
      }
      const data = await res.json();
      if (data?.scan?.id) {
        router.push(`/app/scans/${data.scan.id}`);
      }
    } catch {
      setScanError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function rescan(appId: string) {
    setRescanId(appId);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.scan?.id) {
          router.push(`/app/scans/${data.scan.id}`);
          return;
        }
      }
    } catch {
      /* ignore */
    } finally {
      setRescanId(null);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/* New scan */}
      <section>
        <h2 className="text-sm font-medium text-muted">Escanear um app</h2>
        <form
          onSubmit={startScan}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-faint">
              https://
            </span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="cole a URL do seu app"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-[4.2rem] pr-3 font-mono text-sm text-ink placeholder:text-faint outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="nome (opcional)"
            className="rounded-lg border border-border bg-surface py-2.5 px-3 text-sm text-ink placeholder:text-faint outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20 sm:w-44"
          />
          <button
            type="submit"
            disabled={submitting}
            className="shrink-0 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-soft disabled:opacity-60"
          >
            {submitting ? "Escaneando…" : "Escanear"}
          </button>
        </form>

        {scanError && (
          <p className="mt-2 text-sm text-red-300">{scanError}</p>
        )}
        {planLimited && (
          <div className="mt-3 flex flex-col items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-200">
              Limite do plano gratuito atingido (1 app). Faça upgrade para
              escanear mais apps e ativar monitoramento contínuo.
            </p>
            <Link
              href="/app/upgrade"
              className="shrink-0 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              Fazer upgrade
            </Link>
          </div>
        )}
      </section>

      {/* Apps */}
      <section>
        <h2 className="text-sm font-medium text-muted">Seus apps</h2>
        {loading ? (
          <DashSkeleton />
        ) : loadError ? (
          <p className="mt-3 text-sm text-red-300">
            Não foi possível carregar seus apps.
          </p>
        ) : apps.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <div
                key={app.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {app.name}
                    </p>
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate font-mono text-xs text-faint hover:text-muted"
                    >
                      {app.url}
                    </a>
                  </div>
                  <GradeBadge grade={app.lastGrade} size="md" glow />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-faint">
                    {app.lastScanAt
                      ? `escaneado ${timeAgo(app.lastScanAt)}`
                      : "nunca escaneado"}
                  </span>
                  <div className="flex items-center gap-2">
                    {app.lastScanId && (
                      <Link
                        href={`/app/scans/${app.lastScanId}`}
                        className="rounded-md px-2 py-1 text-xs text-muted transition hover:bg-white/5 hover:text-ink"
                      >
                        Ver
                      </Link>
                    )}
                    <button
                      onClick={() => rescan(app.id)}
                      disabled={rescanId === app.id}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink transition hover:border-brand/40 hover:text-brand-soft disabled:opacity-60"
                    >
                      {rescanId === app.id ? "…" : "Re-scan"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent scans */}
      {!loading && scans.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted">Scans recentes</h2>
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {scans.slice(0, 12).map((scan) => {
              const app = apps.find((a) => a.id === scan.appId);
              return (
                <Link
                  key={scan.id}
                  href={`/app/scans/${scan.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
                >
                  <GradeBadge grade={scan.grade} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">
                      {app?.name ?? scan.url}
                    </p>
                    <p className="truncate font-mono text-xs text-faint">
                      {scan.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-faint">
                    {scan.status !== "done" && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-muted">
                        {scan.status}
                      </span>
                    )}
                    {scan.counts?.critical > 0 && (
                      <span className="text-red-300">
                        {scan.counts.critical} crítico
                        {scan.counts.critical > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="hidden sm:inline">
                      {timeAgo(scan.finishedAt ?? scan.startedAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {!isPro && !loading && apps.length > 0 && (
        <div className="rounded-xl border border-border bg-gradient-to-r from-amber-500/[0.06] to-transparent p-4 text-sm text-muted">
          Você está no plano gratuito.{" "}
          <Link
            href="/app/upgrade"
            className="font-medium text-brand-soft hover:underline"
          >
            Faça upgrade para o Pro
          </Link>{" "}
          e ative monitoramento contínuo com alerta a cada deploy.
        </div>
      )}
    </div>
  );
}

function DashSkeleton() {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-28 animate-ss-pulse rounded-xl border border-border bg-surface"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">
        Nenhum app escaneado ainda.
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        Cole a URL do seu app publicado acima. Em segundos você recebe uma nota
        A–F e a lista do que está exposto para a internet.
      </p>
    </div>
  );
}
