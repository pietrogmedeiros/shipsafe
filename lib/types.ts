// Shared domain contract for ShipSafe. Every agent imports from here.
// Do NOT redefine these shapes elsewhere.

export type Plan = "free" | "pro";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  plan: Plan;
  planUntil: string | null; // ISO; when pro access expires
  createdAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  planUntil: string | null;
}

// An app the user registers to be scanned (their deployed URL).
export interface App {
  id: string;
  userId: string;
  name: string;
  url: string; // deployed production URL
  createdAt: string;
  lastScanId: string | null;
  lastScanAt: string | null;
  lastGrade: Grade | null;
  monitor: boolean; // pro: continuous re-scan on schedule
}

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Grade = "A" | "B" | "C" | "D" | "F";

// Category maps to a check module in lib/scanner/*.
export type FindingCategory =
  | "exposed-secret"
  | "supabase-rls"
  | "exposed-file"
  | "security-header"
  | "open-endpoint"
  | "source-map"
  | "info-leak";

export interface Finding {
  id: string;
  scanId: string;
  appId: string;
  userId: string; // denormalized for cheap ES aggregation
  ts: string;
  severity: Severity;
  category: FindingCategory;
  title: string; // short, builder-friendly
  detail: string; // what it means, plain language
  evidence: string; // redacted proof (e.g. masked key, url probed)
  remediation: string; // step-by-step fix
  location: string | null; // url / file / bundle where found
  fixed: boolean;
}

export type ScanStatus = "queued" | "running" | "done" | "failed";

export interface Scan {
  id: string;
  appId: string;
  userId: string;
  url: string;
  status: ScanStatus;
  startedAt: string;
  finishedAt: string | null;
  grade: Grade | null;
  score: number | null; // 0-100
  counts: Record<Severity, number>;
  error: string | null;
}

// What a single check module returns to the orchestrator.
export interface RawFinding {
  severity: Severity;
  category: FindingCategory;
  title: string;
  detail: string;
  evidence: string;
  remediation: string;
  location?: string | null;
}

export interface Payment {
  id: string;
  userId: string;
  abacateId: string;
  amount: number; // cents
  status: "pending" | "paid" | "failed";
  createdAt: string;
  paidAt: string | null;
}

// User-submitted improvement suggestion or feature request.
export type FeedbackType = "suggestion" | "feature";

export interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: FeedbackType;
  message: string;
  createdAt: string;
}
