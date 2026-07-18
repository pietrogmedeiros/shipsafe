import { Mascot } from "@/components/Mascot";

/**
 * Presentational "live scan" terminal shown in the hero.
 * Pure CSS staggered reveal + scanline; all motion is gated by
 * prefers-reduced-motion (lines default to opacity:1 so they stay
 * visible when animation is disabled).
 */
const CSS = `
.ss-con{--ss-step:.42s}
.ss-con .ss-line{animation:ssReveal .5s ease both}
.ss-con .ss-scan{animation:ssScan 3.6s ease-in-out infinite}
.ss-con .ss-cursor{animation:ssBlink 1.05s steps(1) infinite}
@keyframes ssReveal{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes ssBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes ssScan{0%,100%{transform:translateY(-8%);opacity:0}45%{opacity:.9}55%{opacity:.9}90%{transform:translateY(760%);opacity:0}}
@media (prefers-reduced-motion:reduce){
  .ss-con .ss-line,.ss-con .ss-scan,.ss-con .ss-cursor{animation:none!important}
  .ss-con .ss-scan{display:none}
}
`;

function Line({
  children,
  delay,
  tone = "muted",
}: {
  children: React.ReactNode;
  delay: number;
  tone?: "muted" | "ink" | "brand" | "danger" | "faint";
}) {
  const color =
    tone === "danger"
      ? "text-red-400"
      : tone === "brand"
        ? "text-brand-soft"
        : tone === "ink"
          ? "text-ink"
          : tone === "faint"
            ? "text-faint"
            : "text-muted";
  return (
    <div
      className={`ss-line flex gap-2 ${color}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function LandingScanConsole() {
  return (
    <div className="ss-con relative w-full max-w-lg">
      <style>{CSS}</style>

      {/* Blocky peeking over the console, angry about what it found */}
      <div className="pointer-events-none absolute -right-3 -top-14 z-20 sm:-right-8 sm:-top-16">
        <Mascot mood="angry" size={104} />
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-[#0a0c10] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
        {/* title bar */}
        <div className="flex items-center gap-2 border-b border-border-soft bg-surface/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2a2f38]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2a2f38]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2a2f38]" />
          <span className="ml-2 font-mono text-[11px] text-faint">
            safeship — scan
          </span>
        </div>

        {/* scanline sweep */}
        <div className="pointer-events-none absolute inset-x-0 top-10 z-10 h-16">
          <div className="ss-scan mx-4 h-px bg-gradient-to-r from-transparent via-brand/70 to-transparent" />
        </div>

        {/* body */}
        <div className="relative space-y-1.5 px-4 py-4 font-mono text-[12.5px] leading-relaxed sm:text-[13px]">
          <Line delay={0} tone="ink">
            <span className="text-brand">$</span>
            <span>safeship scan https://meu-app.vercel.app</span>
          </Line>
          <Line delay={0.5} tone="faint">
            sondando superfície pública…
          </Line>
          <Line delay={1.0} tone="brand">
            <span>✓</span>
            <span>TLS + headers básicos</span>
          </Line>
          <Line delay={1.5} tone="danger">
            <span>✗</span>
            <span>SUPABASE_ANON_KEY exposta em /_next/…/main.js</span>
          </Line>
          <Line delay={2.0} tone="danger">
            <span>✗</span>
            <span>RLS desligado na tabela `users`</span>
          </Line>
          <Line delay={2.5} tone="danger">
            <span>✗</span>
            <span>/.env acessível (200 OK)</span>
          </Line>

          <div
            className="ss-line mt-3 flex items-center gap-3 border-t border-border-soft pt-3"
            style={{ animationDelay: "3s" }}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-red-500/40 bg-red-500/10 text-2xl font-bold tracking-tight text-red-400">
              F
            </span>
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-wide text-faint">
                nota do scan
              </div>
              <div className="text-sm font-semibold text-ink">
                3 vulnerabilidades críticas
                <span className="ss-cursor ml-1 inline-block h-4 w-2 translate-y-0.5 bg-brand align-middle" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
