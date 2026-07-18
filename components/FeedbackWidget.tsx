"use client";

import { useState } from "react";
import { Mascot } from "./Mascot";
import type { FeedbackType } from "@/lib/types";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    // reset after the close transition
    setTimeout(() => {
      setSent(false);
      setMessage("");
      setError(null);
      setType("suggestion");
    }, 200);
  }

  async function submit() {
    if (message.trim().length < 3) {
      setError("Escreve um pouquinho mais 🙂");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim() }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("Não deu pra enviar agora. Tenta de novo.");
      }
    } catch {
      setError("Erro de conexão. Tenta de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition hover:bg-white/5 hover:text-ink sm:inline-flex"
        title="Sugerir melhoria ou pedir uma feature"
      >
        💡 <span>Sugerir</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Mascot mood="happy" size={120} />
                <p className="text-lg font-semibold text-ink">
                  Valeu! O Blocky recebeu 🎉
                </p>
                <p className="max-w-xs text-sm text-muted">
                  Sua ideia foi registrada. A gente lê tudo — é assim que o
                  SafeShip melhora.
                </p>
                <button
                  onClick={close}
                  className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-black hover:bg-brand-soft"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Mascot mood="happy" size={56} />
                    <div>
                      <h2 className="text-base font-semibold text-ink">
                        Fale com o Blocky
                      </h2>
                      <p className="text-xs text-muted">
                        Uma melhoria ou uma ideia de feature?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    className="rounded-md p-1 text-faint hover:bg-white/5 hover:text-ink"
                    aria-label="Fechar"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {(
                    [
                      { k: "suggestion", label: "💡 Melhoria" },
                      { k: "feature", label: "✨ Nova feature" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.k}
                      onClick={() => setType(o.k)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        type === o.k
                          ? "border-brand/50 bg-brand/10 text-ink"
                          : "border-border bg-bg text-muted hover:text-ink"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder={
                    type === "feature"
                      ? "Que feature deixaria o SafeShip perfeito pra você?"
                      : "O que a gente pode melhorar? (inclusive no Blocky 🧱)"
                  }
                  className="mt-3 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
                />

                {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

                <button
                  onClick={submit}
                  disabled={busy}
                  className="mt-3 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-soft disabled:opacity-60"
                >
                  {busy ? "Enviando…" : "Enviar pro Blocky"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
