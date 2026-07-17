import { nanoid } from "nanoid";
import { runAllChecks } from "./scanner";
import {
  createScan,
  finishScan,
  saveFindings,
  updateAppAfterScan,
} from "./repo";
import type { App, Finding, Scan } from "./types";

// Orchestrates a single scan: create scan doc -> run the engine ->
// persist findings + rollup to Elasticsearch -> update the app. The engine
// (lib/scanner) never throws out of runAllChecks, but we still guard here so
// a scan is always closed as done|failed.
export async function runScan(app: App): Promise<Scan> {
  const scan = await createScan(app);
  try {
    const result = await runAllChecks(app.url);
    const finishedAt = new Date().toISOString();

    const findingDocs: Finding[] = result.findings.map((f) => ({
      id: nanoid(),
      scanId: scan.id,
      appId: app.id,
      userId: app.userId,
      ts: finishedAt,
      severity: f.severity,
      category: f.category,
      title: f.title,
      detail: f.detail,
      evidence: f.evidence,
      remediation: f.remediation,
      location: f.location ?? null,
      fixed: false,
    }));

    await saveFindings(findingDocs);
    await finishScan(scan.id, {
      status: "done",
      grade: result.grade,
      score: result.score,
      counts: result.counts,
    });
    await updateAppAfterScan(app.id, {
      id: scan.id,
      grade: result.grade,
      finishedAt,
    });

    return {
      ...scan,
      status: "done",
      finishedAt,
      grade: result.grade,
      score: result.score,
      counts: result.counts,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finishScan(scan.id, { status: "failed", error: msg });
    return { ...scan, status: "failed", error: msg };
  }
}
