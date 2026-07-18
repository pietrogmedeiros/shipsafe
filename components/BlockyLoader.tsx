"use client";

import { useEffect, useState } from "react";
import { Mascot, type Mood } from "./Mascot";

// Blocky cycling through moods while a scan runs — the app's "loading" state.
const CYCLE: Mood[] = ["neutral", "angry", "happy"];

// Playful "attacker trying to break in" lines, shuffled through under Blocky.
const QUIPS = [
  "tentando pular o portão…",
  "ixi, tem cachorro no pátio…",
  "opa, cerca elétrica…",
  "procurando a chave embaixo do tapete…",
  "testando se a janela ficou aberta…",
  "cutucando a fechadura…",
  "será que deixaram o .env na porta?",
  "checando se o RLS tá dormindo…",
  "farejando chave de API no bundle…",
  "batendo na porta dos fundos…",
];

export function BlockyLoader({
  label = "Escaneando seu app…",
  size = 128,
}: {
  label?: string;
  size?: number;
}) {
  const [i, setI] = useState(0);
  const [q, setQ] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % CYCLE.length), 720);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setQ((n) => (n + 1) % QUIPS.length), 1700);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Mascot mood={CYCLE[i]} size={size} />
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p
          key={q}
          className="mt-1 animate-ss-fade font-mono text-xs text-faint"
        >
          {QUIPS[q]}
        </p>
      </div>
    </div>
  );
}

// Full-screen backdrop version, for blocking actions like a new scan.
export function BlockyLoaderOverlay({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
      <BlockyLoader label={label} size={148} />
    </div>
  );
}
