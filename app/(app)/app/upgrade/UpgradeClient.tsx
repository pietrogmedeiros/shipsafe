"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";

interface UpgradeResponse {
  paymentId: string;
  brCode: string;
  brCodeBase64: string;
  demo: boolean;
  alreadyPro?: boolean;
  freeUpgrade?: boolean;
  amount?: number; // final price in centavos (after coupon)
  coupon?: { code: string; label: string } | null;
  error?: string;
}

type Phase = "idle" | "loading" | "pending" | "paid" | "error";

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const PRO_PERKS = [
  "Até 25 apps monitorados",
  "Monitoramento contínuo + alerta a cada deploy",
  "Relatório em PDF",
  'Selo "Secured by SafeShip"',
];

export default function UpgradeClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [charge, setCharge] = useState<UpgradeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [coupon, setCoupon] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = useCallback((paymentId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/billing/status?paymentId=${encodeURIComponent(paymentId)}`,
        );
        const data = (await res.json()) as { status?: string };
        if (data.status === "paid") {
          stopPolling();
          if (posthog.__loaded) posthog.capture("pro_activated", { via: "pix" });
          setPhase("paid");
          setTimeout(() => {
            window.location.href = "/app";
          }, 2500);
        }
      } catch {
        // transient; keep polling
      }
    }, 3000);
  }, []);

  const generatePix = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon: coupon.trim() || undefined }),
      });
      const data = (await res.json()) as UpgradeResponse;
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 400 && data.error === "invalid_coupon") {
        setError("Cupom inválido.");
        setPhase("idle");
        return;
      }
      // alreadyPro, or a 100%-off coupon that granted Pro without Pix.
      if (data.alreadyPro || data.freeUpgrade) {
        if (data.freeUpgrade && posthog.__loaded)
          posthog.capture("pro_activated", { via: "coupon" });
        setPhase("paid");
        setTimeout(() => (window.location.href = "/app"), 1500);
        return;
      }
      if (!res.ok || !data.paymentId) {
        throw new Error(data.error || "Falha ao gerar o Pix");
      }
      setCharge(data);
      setPhase("pending");
      startPolling(data.paymentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setPhase("error");
    }
  }, [startPolling, coupon]);

  const copyCode = useCallback(async () => {
    if (!charge) return;
    try {
      await navigator.clipboard.writeText(charge.brCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; user can select manually */
    }
  }, [charge]);

  return (
    <main className="min-h-full bg-neutral-950 px-6 py-14 text-neutral-100">
      <div className="mx-auto grid w-full max-w-4xl gap-10 md:grid-cols-2">
        {/* Pitch */}
        <section>
          <p className="font-mono text-xs uppercase tracking-widest text-amber-500">
            SafeShip Pro
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Segurança contínua, não só um scan.
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            O free mostra tudo uma vez. O Pro vigia seus deploys e te avisa
            antes que o vazamento vire manchete.
          </p>
          <ul className="mt-6 space-y-3">
            {PRO_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-amber-400">✓</span>
                <span className="text-neutral-200">{perk}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-amber-400">
              R$50,00
            </span>
            <span className="text-sm text-neutral-500">/ ano · via Pix</span>
          </div>
        </section>

        {/* Checkout */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
          {phase === "idle" && (
            <div className="flex h-full flex-col justify-center">
              <p className="text-center text-sm text-neutral-400">
                Pague com Pix e ative o Pro na hora.
              </p>
              <label
                htmlFor="coupon"
                className="mt-6 block text-xs font-medium text-neutral-400"
              >
                Cupom de desconto (opcional)
              </label>
              <input
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="ex: BIIP"
                className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-neutral-100 placeholder:text-neutral-600 focus:border-amber-500/50 focus:outline-none"
              />
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
              <button
                onClick={generatePix}
                className="mt-4 rounded-lg bg-amber-500 px-4 py-3 text-sm font-medium text-neutral-950 hover:bg-amber-400"
              >
                Gerar Pix
              </button>
            </div>
          )}

          {phase === "loading" && (
            <div className="flex h-full items-center justify-center py-16 text-sm text-neutral-400">
              Gerando cobrança Pix…
            </div>
          )}

          {(phase === "pending" || phase === "paid") && charge && (
            <div className="text-center">
              {charge.demo && (
                <p className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-mono text-[11px] text-amber-300">
                  modo demonstração — pagamento simulado
                </p>
              )}
              <div className="mx-auto w-fit rounded-lg bg-white p-3">
                {/* brCodeBase64 is a data URI */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={charge.brCodeBase64}
                  alt="QR Code Pix"
                  width={180}
                  height={180}
                />
              </div>

              <p className="mt-4 text-xs text-neutral-500">
                Pix copia e cola
              </p>
              <div className="mt-1 flex items-stretch gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-left font-mono text-[11px] text-neutral-300">
                  {charge.brCode}
                </code>
                <button
                  onClick={copyCode}
                  className="shrink-0 rounded-md border border-amber-500/40 px-3 text-xs text-amber-300 hover:bg-amber-500/10"
                >
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>

              <p className="mt-4 font-mono text-sm text-neutral-200">
                {brl(charge.amount ?? 5000)}
                {charge.coupon && (
                  <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] text-amber-300">
                    {charge.coupon.label}
                  </span>
                )}
              </p>

              {phase === "pending" && (
                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  Aguardando pagamento…
                </p>
              )}
              {phase === "paid" && (
                <p className="mt-4 text-sm font-medium text-amber-400">
                  Pagamento confirmado — você é Pro! Redirecionando…
                </p>
              )}
            </div>
          )}

          {phase === "error" && (
            <div className="flex h-full flex-col justify-center text-center">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={generatePix}
                className="mt-5 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
              >
                Tentar de novo
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
