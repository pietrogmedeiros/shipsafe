// Turn a list of findings into a 0-100 score and an A-F grade.

import type { RawFinding, Severity, Grade } from "../types";

const SEVERITY_PENALTY: Record<Severity, number> = {
  critical: 40,
  high: 20,
  medium: 8,
  low: 3,
  info: 0,
};

export interface ScoreResult {
  score: number;
  grade: Grade;
  counts: Record<Severity, number>;
}

function gradeFromScore(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 55) return "C";
  if (score >= 35) return "D";
  return "F";
}

export function scoreFindings(findings: RawFinding[]): ScoreResult {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  let score = 100;
  for (const f of findings) {
    counts[f.severity]++;
    score -= SEVERITY_PENALTY[f.severity];
  }
  if (score < 0) score = 0;

  let grade = gradeFromScore(score);
  // Any critical finding caps the grade at D — you can't be "safe-ish" with a
  // critical data leak, no matter how few other issues you have.
  if (counts.critical > 0 && (grade === "A" || grade === "B" || grade === "C")) {
    grade = "D";
  }

  return { score, grade, counts };
}
