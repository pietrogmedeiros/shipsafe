// Manual self-test: run the full scanner against a few real public URLs and
// print a summary. Run with:
//   cd /Users/pietro_medeiros/shipsafe && npx tsx lib/scanner/__selftest.ts

import { runAllChecks } from "./index";
import type { RawFinding } from "../types";

const TARGETS = [
  "https://example.com",
  "https://vercel.com",
  "https://neverssl.com",
];

function summarize(findings: RawFinding[]): string {
  if (findings.length === 0) return "  (nenhum achado)";
  return findings
    .map(
      (f) =>
        `  [${f.severity.toUpperCase().padEnd(8)}] ${f.category.padEnd(16)} ${f.title}`,
    )
    .join("\n");
}

async function main() {
  for (const url of TARGETS) {
    const started = Date.now();
    console.log(`\n=== Scanning ${url} ===`);
    try {
      const res = await runAllChecks(url);
      const ms = Date.now() - started;
      console.log(
        `Grade: ${res.grade}  Score: ${res.score}  (${ms}ms)  counts=${JSON.stringify(
          res.counts,
        )}`,
      );
      console.log(summarize(res.findings));
    } catch (err) {
      console.error(`  THREW (should never happen): ${String(err)}`);
    }
  }
  console.log("\nDone.");
}

main();
