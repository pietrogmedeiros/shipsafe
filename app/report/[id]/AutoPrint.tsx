"use client";

import { useEffect } from "react";

// Opens the print dialog once the report has rendered (used by the PDF view).
export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      <button
        onClick={() => window.print()}
        style={{
          background: "#f5c518",
          color: "#111",
          border: "none",
          borderRadius: 8,
          padding: "9px 16px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Baixar / Imprimir PDF
      </button>
      <button
        onClick={() => history.back()}
        style={{
          color: "#666",
          fontSize: 14,
          padding: "9px 8px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        ← Voltar
      </button>
    </div>
  );
}
