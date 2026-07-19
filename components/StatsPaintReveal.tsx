"use client";

import { useEffect, useRef, useState } from "react";

type Stat = {
  target: number;
  decimals?: number;
  suffix?: string;
  label: string;
};

// Same numbers/labels as before — now painted in by Blocky when scrolled into view.
const STATS: Stat[] = [
  {
    target: 11,
    suffix: "%",
    label: "dos apps vibe-coded vazam credenciais do Supabase",
  },
  {
    target: 380,
    suffix: " mil",
    label: "apps encontrados vazando dados de usuários",
  },
  {
    target: 1.5,
    decimals: 1,
    suffix: " mi",
    label: "de chaves expostas em um único caso: o Moltbook",
  },
];

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Compact Blocky holding a paint roller — rides the leading edge of the paint.
function PainterBlocky() {
  return (
    <svg
      width="40"
      height="34"
      viewBox="0 0 40 34"
      fill="none"
      className="drop-shadow-[0_3px_8px_rgba(245,197,24,0.45)]"
    >
      {/* paint roller */}
      <rect
        x="2"
        y="12"
        width="12"
        height="3"
        rx="1.5"
        fill="#c99a12"
        transform="rotate(-22 8 13)"
      />
      <rect
        x="1"
        y="17"
        width="11"
        height="7"
        rx="2.5"
        fill="#f5c518"
        stroke="#c99a12"
        strokeWidth="1"
      />
      <circle cx="6" cy="27" r="1.4" fill="#f5c518" />
      {/* Blocky head */}
      <rect x="18" y="6" width="9" height="3.5" rx="1.75" fill="#f7d449" />
      <rect
        x="15"
        y="9"
        width="21"
        height="21"
        rx="6"
        fill="#f5c518"
        stroke="#c99a12"
        strokeWidth="1.3"
      />
      <circle cx="22" cy="18" r="2" fill="#141414" />
      <circle cx="30" cy="18" r="2" fill="#141414" />
      <path
        d="M21 23 Q26 27 31 23"
        stroke="#141414"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({
  stat,
  started,
  delay,
}: {
  stat: Stat;
  started: boolean;
  delay: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    let raf = 0;
    let startT = 0;
    const dur = 1300;
    const delayMs = delay * 1000;
    const tick = (t: number) => {
      if (!startT) startT = t;
      const elapsed = t - startT - delayMs;
      if (elapsed >= 0) {
        const p = Math.min(1, elapsed / dur);
        setProgress(1 - Math.pow(1 - p, 3)); // easeOutCubic
        if (p >= 1) return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, delay]);

  const finalDisplay = fmt(stat.target, stat.decimals) + (stat.suffix ?? "");
  const display = fmt(stat.target * progress, stat.decimals) + (stat.suffix ?? "");
  const unpaint = (1 - progress) * 100; // % of the number still unpainted (right side)
  const painting = progress > 0.02 && progress < 0.995;

  return (
    <div className="bg-surface px-6 py-8">
      <div className="relative inline-block">
        {/* accessible final value */}
        <span className="sr-only">{finalDisplay}</span>

        {/* invisible sizer reserves the final width so layout never shifts */}
        <span
          aria-hidden
          className="invisible text-4xl font-bold tracking-tight sm:text-5xl"
        >
          {finalDisplay}
        </span>

        {/* the number, painted in left→right */}
        <span
          aria-hidden
          className="absolute inset-0 text-4xl font-bold tracking-tight text-brand-soft sm:text-5xl"
          style={{ clipPath: `inset(-20% ${unpaint}% -20% 0)` }}
        >
          {display}
        </span>

        {/* wet-paint glow at the leading edge */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-8 -translate-x-1/2 blur-md"
          style={{
            left: `${progress * 100}%`,
            opacity: painting ? 0.75 : 0,
            background:
              "radial-gradient(closest-side, rgba(245,197,24,0.55), transparent)",
          }}
        />

        {/* Blocky painter riding the paint edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0"
          style={{
            left: `${progress * 100}%`,
            transform: "translate(-45%, -95%)",
            opacity: painting ? 1 : 0,
            transition: "opacity .18s ease",
          }}
        >
          <PainterBlocky />
        </div>
      </div>

      <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-muted">
        {stat.label}
      </p>
    </div>
  );
}

export function StatsPaintReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStarted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3"
    >
      {STATS.map((s, i) => (
        <StatCard key={s.label} stat={s} started={started} delay={i * 0.18} />
      ))}
    </div>
  );
}
