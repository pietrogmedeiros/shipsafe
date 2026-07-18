import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUser, getScan, listFindings } from "@/lib/repo";
import { effectivePlan } from "@/lib/plan";
import { SEVERITY_ORDER, SEVERITY_LABEL, CATEGORY_LABEL } from "@/components/severity";
import { AutoPrint } from "./AutoPrint";
import type { Severity } from "@/lib/types";

const SEV_COLOR: Record<Severity, string> = {
  critical: "#b91c1c",
  high: "#c2410c",
  medium: "#b45309",
  low: "#475569",
  info: "#64748b",
};

const GRADE_BG: Record<string, string> = {
  A: "#fde047",
  B: "#fcd34d",
  C: "#fdba74",
  D: "#fb923c",
  F: "#f87171",
};

function BlockyWatermark() {
  return (
    <svg
      className="wm"
      viewBox="0 0 160 190"
      width="420"
      aria-hidden="true"
    >
      <rect x="52" y="150" width="24" height="34" rx="4" fill="#111" />
      <rect x="84" y="150" width="24" height="34" rx="4" fill="#111" />
      <path d="M50 104 H110 L118 154 H42 Z" fill="#111" />
      <rect x="66" y="16" width="28" height="14" rx="6" fill="#111" />
      <rect x="46" y="28" width="68" height="70" rx="18" fill="#111" />
      <circle cx="66" cy="60" r="5.5" fill="#fff" />
      <circle cx="94" cy="60" r="5.5" fill="#fff" />
      <path d="M64 76 Q80 90 96 76" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default async function ReportPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const user = await getUser(session.id);
  if (!user || effectivePlan(user) !== "pro") {
    // PDF export is a Pro perk.
    redirect("/app/upgrade");
  }

  const scan = await getScan(id);
  if (!scan || scan.userId !== session.id) redirect("/app");

  const findings = await listFindings(id);
  const grouped = SEVERITY_ORDER.map((sev) => ({
    sev,
    items: findings.filter((f) => f.severity === sev),
  })).filter((g) => g.items.length > 0);

  const generatedAt = new Date().toLocaleString("pt-BR");
  const counts = scan.counts ?? {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  return (
    <div className="pdf">
      <style>{`
        .pdf { position: relative; max-width: 820px; margin: 0 auto; padding: 40px 44px 64px;
               background: #fff; color: #1a1a1a; font-family: ui-sans-serif, system-ui, sans-serif;
               line-height: 1.5; }
        .pdf .wm { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-18deg);
                   opacity: 0.04; z-index: 0; pointer-events: none; }
        .pdf > *:not(.wm) { position: relative; z-index: 1; }
        .pdf h1 { font-size: 22px; margin: 0; letter-spacing: -0.01em; }
        .pdf h2 { font-size: 15px; margin: 28px 0 10px; text-transform: uppercase;
                  letter-spacing: 0.06em; color: #555; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .card { border: 1px solid #e5e5e5; border-radius: 10px; padding: 14px 16px; margin: 10px 0;
                break-inside: avoid; }
        .evb { background: #f6f6f6; border-radius: 6px; padding: 8px 10px; font-size: 12px;
               white-space: pre-wrap; word-break: break-word; }
        @media print {
          .no-print { display: none !important; }
          .pdf { padding: 0; max-width: none; }
          @page { margin: 1.6cm; }
        }
        html, body { background: #fff; }
      `}</style>

      <BlockyWatermark />

      <AutoPrint />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #111", paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
            <rect x="9.5" y="2.6" width="5" height="2.6" rx="1.2" fill="#e0a800" />
            <rect x="5.4" y="5" width="13.2" height="14" rx="3.6" fill="#f5c518" stroke="#c99a12" strokeWidth="0.8" />
            <circle cx="9.6" cy="11.4" r="1.35" fill="#141414" />
            <circle cx="14.4" cy="11.4" r="1.35" fill="#141414" />
            <path d="M9 14.4 Q12 17.1 15 14.4" stroke="#141414" strokeWidth="1.15" fill="none" strokeLinecap="round" />
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>SafeShip</div>
            <div style={{ fontSize: 12, color: "#777" }}>Relatório de Segurança</div>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "#777" }}>
          Gerado em {generatedAt}
          <br />
          safeship.space
        </div>
      </div>

      {/* Summary */}
      <h1 style={{ marginTop: 24 }}>{scan.url}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 14 }}>
        <div
          style={{
            width: 74, height: 74, borderRadius: 14, display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800,
            background: GRADE_BG[scan.grade ?? "F"] ?? "#eee", color: "#3a2a00",
          }}
        >
          {scan.grade ?? "—"}
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {scan.score ?? "—"}
            <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}> / 100</span>
          </div>
          <div className="mono" style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
            {counts.critical} críticas · {counts.high} altas · {counts.medium} médias · {counts.low} baixas
          </div>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 14, color: "#333" }}>
        {counts.critical > 0
          ? `Encontramos ${counts.critical} vulnerabilidade(s) crítica(s) expostas na internet. Corrija-as com prioridade máxima — os passos estão abaixo.`
          : findings.length === 0
            ? "Nenhum achado nas verificações externas. Seu app passou no raio-x do SafeShip."
            : "Nenhuma vulnerabilidade crítica, mas há itens a endurecer. Veja os detalhes abaixo."}
      </p>

      {/* Findings */}
      {grouped.map((group) => (
        <section key={group.sev}>
          <h2 style={{ color: SEV_COLOR[group.sev] }}>
            {SEVERITY_LABEL[group.sev]} · {group.items.length}
          </h2>
          {group.items.map((f) => (
            <div key={f.id} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em",
                    color: "#fff", background: SEV_COLOR[f.severity], borderRadius: 4, padding: "2px 6px",
                  }}
                >
                  {SEVERITY_LABEL[f.severity]}
                </span>
                <span style={{ fontSize: 12, color: "#888" }}>{CATEGORY_LABEL[f.category]}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 8 }}>{f.title}</div>
              <p style={{ fontSize: 13, color: "#333", margin: "6px 0 0" }}>{f.detail}</p>
              {f.evidence && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 3 }}>Evidência</div>
                  <div className="evb mono">{f.evidence}</div>
                </div>
              )}
              {f.remediation && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 3 }}>Como corrigir</div>
                  <p style={{ fontSize: 13, color: "#1a1a1a", margin: 0, whiteSpace: "pre-line" }}>
                    {f.remediation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </section>
      ))}

      {/* Footer */}
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #e5e5e5", fontSize: 11, color: "#999", textAlign: "center" }}>
        Secured by SafeShip · relatório gerado automaticamente · safeship.space
      </div>
    </div>
  );
}
