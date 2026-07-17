// Scanner orchestrator. Builds the context once, runs every check with a
// per-check try/catch (one failing check contributes zero findings instead of
// killing the scan), concatenates findings, and scores them.

import type { RawFinding, Grade, Severity } from "../types";
import { buildContext } from "./context";
import type { ScanContext } from "./context";
import { checkSecrets } from "./secrets";
import { checkSupabaseRls } from "./supabaseRls";
import { checkExposedFiles } from "./exposedFiles";
import { checkHeaders } from "./headers";
import { checkSourceMaps } from "./sourceMaps";
import { scoreFindings } from "./score";

export interface ScanResult {
  findings: RawFinding[];
  score: number;
  grade: Grade;
  counts: Record<Severity, number>;
}

// Wrap a check so a throw or a rejected promise never escapes.
async function runCheck(
  name: string,
  fn: () => RawFinding[] | Promise<RawFinding[]>,
): Promise<RawFinding[]> {
  try {
    return await fn();
  } catch (err) {
    // Swallow: a broken check just yields no findings. Log for debugging.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[scanner] check "${name}" failed: ${msg}`);
    return [];
  }
}

export async function runAllChecks(url: string): Promise<ScanResult> {
  let ctx: ScanContext;
  try {
    ctx = await buildContext(url);
  } catch (err) {
    // If we can't even build context, return a graceful empty (F is not right
    // here — no findings means we simply couldn't scan; score stays 100/A).
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[scanner] buildContext failed: ${msg}`);
    const { score, grade, counts } = scoreFindings([]);
    return { findings: [], score, grade, counts };
  }

  // Sync checks run instantly; async checks run concurrently.
  const results = await Promise.all([
    runCheck("secrets", () => checkSecrets(ctx)),
    runCheck("headers", () => checkHeaders(ctx)),
    runCheck("supabaseRls", () => checkSupabaseRls(ctx)),
    runCheck("exposedFiles", () => checkExposedFiles(ctx)),
    runCheck("sourceMaps", () => checkSourceMaps(ctx)),
  ]);

  const findings = results.flat();
  const { score, grade, counts } = scoreFindings(findings);
  return { findings, score, grade, counts };
}

export {
  buildContext,
  checkSecrets,
  checkSupabaseRls,
  checkExposedFiles,
  checkHeaders,
  checkSourceMaps,
  scoreFindings,
};
export type { ScanContext } from "./context";
export { extractSupabase } from "./secrets";
