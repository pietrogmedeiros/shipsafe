import type { Severity, Grade, FindingCategory } from "@/lib/types";

export const SEVERITY_ORDER: Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
  info: "Info",
};

// Tailwind class bundles per severity (chips / borders / text).
export const SEVERITY_STYLE: Record<
  Severity,
  { chip: string; dot: string; text: string }
> = {
  critical: {
    chip: "bg-red-500/12 text-red-300 ring-1 ring-inset ring-red-500/30",
    dot: "bg-red-400",
    text: "text-red-300",
  },
  high: {
    chip: "bg-orange-500/12 text-orange-300 ring-1 ring-inset ring-orange-500/30",
    dot: "bg-orange-400",
    text: "text-orange-300",
  },
  medium: {
    chip: "bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-500/30",
    dot: "bg-amber-400",
    text: "text-amber-300",
  },
  low: {
    chip: "bg-sky-500/12 text-sky-300 ring-1 ring-inset ring-sky-500/30",
    dot: "bg-sky-400",
    text: "text-sky-300",
  },
  info: {
    chip: "bg-white/6 text-muted ring-1 ring-inset ring-white/10",
    dot: "bg-zinc-400",
    text: "text-muted",
  },
};

export const GRADE_STYLE: Record<
  Grade,
  { text: string; ring: string; bg: string; glow: string }
> = {
  A: {
    text: "text-yellow-200",
    ring: "ring-yellow-300/45",
    bg: "bg-yellow-300/10",
    glow: "shadow-[0_0_40px_-8px_rgba(253,224,71,0.55)]",
  },
  B: {
    text: "text-yellow-400",
    ring: "ring-yellow-500/35",
    bg: "bg-yellow-500/10",
    glow: "shadow-[0_0_32px_-10px_rgba(234,179,8,0.4)]",
  },
  C: {
    text: "text-amber-300",
    ring: "ring-amber-500/35",
    bg: "bg-amber-500/10",
    glow: "shadow-[0_0_32px_-10px_rgba(245,158,11,0.4)]",
  },
  D: {
    text: "text-orange-300",
    ring: "ring-orange-500/35",
    bg: "bg-orange-500/10",
    glow: "shadow-[0_0_32px_-10px_rgba(249,115,22,0.4)]",
  },
  F: {
    text: "text-red-300",
    ring: "ring-red-500/40",
    bg: "bg-red-500/10",
    glow: "shadow-[0_0_40px_-8px_rgba(239,68,68,0.5)]",
  },
};

export const CATEGORY_LABEL: Record<FindingCategory, string> = {
  "exposed-secret": "Segredo exposto",
  "supabase-rls": "Supabase RLS",
  "exposed-file": "Arquivo exposto",
  "security-header": "Header de segurança",
  "open-endpoint": "Endpoint aberto",
  "source-map": "Source map",
  "info-leak": "Vazamento de info",
};

export function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
