import { es } from "./es";

// Index names. Prefix keeps ShipSafe isolated on a shared ES cluster.
export const IDX = {
  users: "shipsafe-users",
  apps: "shipsafe-apps",
  scans: "shipsafe-scans",
  findings: "shipsafe-findings",
  payments: "shipsafe-payments",
} as const;

const MAPPINGS: Record<string, Record<string, unknown>> = {
  [IDX.users]: {
    properties: {
      id: { type: "keyword" },
      email: { type: "keyword" },
      passwordHash: { type: "keyword", index: false },
      name: { type: "text" },
      plan: { type: "keyword" },
      planUntil: { type: "date" },
      createdAt: { type: "date" },
    },
  },
  [IDX.apps]: {
    properties: {
      id: { type: "keyword" },
      userId: { type: "keyword" },
      name: { type: "text" },
      url: { type: "keyword" },
      createdAt: { type: "date" },
      lastScanId: { type: "keyword" },
      lastScanAt: { type: "date" },
      lastGrade: { type: "keyword" },
      monitor: { type: "boolean" },
    },
  },
  [IDX.scans]: {
    properties: {
      id: { type: "keyword" },
      appId: { type: "keyword" },
      userId: { type: "keyword" },
      url: { type: "keyword" },
      status: { type: "keyword" },
      startedAt: { type: "date" },
      finishedAt: { type: "date" },
      grade: { type: "keyword" },
      score: { type: "integer" },
      counts: { type: "object", enabled: false },
      error: { type: "text" },
    },
  },
  [IDX.findings]: {
    properties: {
      id: { type: "keyword" },
      scanId: { type: "keyword" },
      appId: { type: "keyword" },
      userId: { type: "keyword" },
      ts: { type: "date" },
      severity: { type: "keyword" },
      category: { type: "keyword" },
      title: { type: "text" },
      detail: { type: "text" },
      evidence: { type: "text", index: false },
      remediation: { type: "text", index: false },
      location: { type: "keyword" },
      fixed: { type: "boolean" },
    },
  },
  [IDX.payments]: {
    properties: {
      id: { type: "keyword" },
      userId: { type: "keyword" },
      abacateId: { type: "keyword" },
      amount: { type: "long" },
      status: { type: "keyword" },
      createdAt: { type: "date" },
      paidAt: { type: "date" },
    },
  },
};

// Idempotent bootstrap: create any missing index with its mapping.
// Safe to call on every boot; existing indices are left untouched.
export async function ensureIndices(): Promise<void> {
  for (const [name, mappings] of Object.entries(MAPPINGS)) {
    const exists = await es.indices.exists({ index: name });
    if (!exists) {
      await es.indices.create({
        index: name,
        mappings: mappings as never,
        settings: { number_of_shards: 1, number_of_replicas: 0 },
      });
    }
  }
}
