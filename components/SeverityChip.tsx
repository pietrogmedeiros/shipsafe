import type { Severity } from "@/lib/types";
import { SEVERITY_LABEL, SEVERITY_STYLE } from "./severity";

export function SeverityChip({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLE[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
