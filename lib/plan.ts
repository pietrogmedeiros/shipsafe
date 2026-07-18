import type { Plan, SessionUser } from "./types";

// Single source of truth for what each tier gets. Every gate reads from here.
// Free shows the FULL scan (grade + all findings + fixes) — that's the hook.
// Pro monetizes the recurring value: more apps, continuous monitoring +
// re-scan alerts on every deploy, PDF report, and the shareable trust badge.
export const PLAN_LIMITS = {
  free: {
    maxApps: 1,
    continuousMonitor: false,
    reScanAlerts: false,
    pdfExport: false,
    removeWatermark: false,
    trustBadge: false,
  },
  pro: {
    maxApps: 25,
    continuousMonitor: true,
    reScanAlerts: true,
    pdfExport: true,
    removeWatermark: true,
    trustBadge: true,
  },
} as const;

export const PRO_PRICE_CENTS = 5000; // R$ 50,00 / year (anual)

// A user is effectively pro only while their paid window is valid.
export function effectivePlan(user: {
  plan: Plan;
  planUntil: string | null;
}): Plan {
  if (user.plan !== "pro") return "free";
  if (!user.planUntil) return "free";
  return new Date(user.planUntil).getTime() > Date.now() ? "pro" : "free";
}

export function limitsFor(user: {
  plan: Plan;
  planUntil: string | null;
}) {
  return PLAN_LIMITS[effectivePlan(user)];
}

export function isPro(user: SessionUser): boolean {
  return effectivePlan(user) === "pro";
}
