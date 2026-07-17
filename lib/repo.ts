import { nanoid } from "nanoid";
import { es } from "./es";
import { IDX, ensureIndices } from "./indices";
import { hashPassword } from "./auth";
import type {
  App,
  Finding,
  Grade,
  Payment,
  Scan,
  Severity,
  User,
} from "./types";

// Lazy, once-per-process index bootstrap so prod boots clean without a
// manual script. Cheap after the first call.
let ensured: Promise<void> | null = null;
function ready(): Promise<void> {
  if (!ensured) ensured = ensureIndices();
  return ensured;
}

const now = () => new Date().toISOString();

// ---------- Users ----------
export async function findUserByEmail(email: string): Promise<User | null> {
  await ready();
  const res = await es.search<User>({
    index: IDX.users,
    size: 1,
    query: { term: { email: email.toLowerCase() } },
  });
  return res.hits.hits[0]?._source ?? null;
}

export async function getUser(id: string): Promise<User | null> {
  await ready();
  try {
    const res = await es.get<User>({ index: IDX.users, id });
    return res._source ?? null;
  } catch {
    return null;
  }
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  await ready();
  const email = input.email.toLowerCase().trim();
  if (await findUserByEmail(email)) {
    throw new Error("EMAIL_TAKEN");
  }
  const user: User = {
    id: nanoid(),
    email,
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    plan: "free",
    planUntil: null,
    createdAt: now(),
  };
  await es.index({
    index: IDX.users,
    id: user.id,
    document: user,
    refresh: "wait_for",
  });
  return user;
}

export async function setUserPlan(
  id: string,
  plan: "free" | "pro",
  planUntil: string | null,
): Promise<void> {
  await ready();
  await es.update({
    index: IDX.users,
    id,
    doc: { plan, planUntil },
    refresh: "wait_for",
  });
}

// ---------- Apps ----------
export async function createApp(
  userId: string,
  input: { name: string; url: string },
): Promise<App> {
  await ready();
  const app: App = {
    id: nanoid(),
    userId,
    name: input.name.trim(),
    url: input.url.trim(),
    createdAt: now(),
    lastScanId: null,
    lastScanAt: null,
    lastGrade: null,
    monitor: false,
  };
  await es.index({
    index: IDX.apps,
    id: app.id,
    document: app,
    refresh: "wait_for",
  });
  return app;
}

export async function getApp(id: string): Promise<App | null> {
  await ready();
  try {
    const res = await es.get<App>({ index: IDX.apps, id });
    return res._source ?? null;
  } catch {
    return null;
  }
}

export async function listApps(userId: string): Promise<App[]> {
  await ready();
  const res = await es.search<App>({
    index: IDX.apps,
    size: 100,
    query: { term: { userId } },
    sort: [{ createdAt: "desc" }],
  });
  return res.hits.hits.map((h) => h._source!).filter(Boolean);
}

export async function countApps(userId: string): Promise<number> {
  await ready();
  const res = await es.count({
    index: IDX.apps,
    query: { term: { userId } },
  });
  return res.count;
}

// ---------- Scans ----------
export async function createScan(app: App): Promise<Scan> {
  await ready();
  const scan: Scan = {
    id: nanoid(),
    appId: app.id,
    userId: app.userId,
    url: app.url,
    status: "running",
    startedAt: now(),
    finishedAt: null,
    grade: null,
    score: null,
    counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    error: null,
  };
  await es.index({
    index: IDX.scans,
    id: scan.id,
    document: scan,
    refresh: "wait_for",
  });
  return scan;
}

export async function finishScan(
  scanId: string,
  patch: {
    status: "done" | "failed";
    grade?: Grade | null;
    score?: number | null;
    counts?: Record<Severity, number>;
    error?: string | null;
  },
): Promise<void> {
  await ready();
  await es.update({
    index: IDX.scans,
    id: scanId,
    doc: { ...patch, finishedAt: now() },
    refresh: "wait_for",
  });
}

export async function getScan(id: string): Promise<Scan | null> {
  await ready();
  try {
    const res = await es.get<Scan>({ index: IDX.scans, id });
    return res._source ?? null;
  } catch {
    return null;
  }
}

export async function listScans(
  userId: string,
  appId?: string,
): Promise<Scan[]> {
  await ready();
  const must: Record<string, unknown>[] = [{ term: { userId } }];
  if (appId) must.push({ term: { appId } });
  const res = await es.search<Scan>({
    index: IDX.scans,
    size: 50,
    query: { bool: { must } },
    sort: [{ startedAt: "desc" }],
  });
  return res.hits.hits.map((h) => h._source!).filter(Boolean);
}

export async function updateAppAfterScan(
  appId: string,
  scan: { id: string; grade: Grade | null; finishedAt: string },
): Promise<void> {
  await ready();
  await es.update({
    index: IDX.apps,
    id: appId,
    doc: {
      lastScanId: scan.id,
      lastScanAt: scan.finishedAt,
      lastGrade: scan.grade,
    },
    refresh: "wait_for",
  });
}

// ---------- Findings ----------
export async function saveFindings(findings: Finding[]): Promise<void> {
  if (!findings.length) return;
  await ready();
  const operations = findings.flatMap((f) => [
    { index: { _index: IDX.findings, _id: f.id } },
    f,
  ]);
  await es.bulk({ operations, refresh: "wait_for" });
}

export async function listFindings(scanId: string): Promise<Finding[]> {
  await ready();
  const res = await es.search<Finding>({
    index: IDX.findings,
    size: 200,
    query: { term: { scanId } },
  });
  const order: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  return res.hits.hits
    .map((h) => h._source!)
    .filter(Boolean)
    .sort((a, b) => order[a.severity] - order[b.severity]);
}

// ---------- Payments (used by the Billing slice) ----------
export async function createPayment(input: {
  userId: string;
  abacateId: string;
  amount: number;
}): Promise<Payment> {
  await ready();
  const payment: Payment = {
    id: nanoid(),
    userId: input.userId,
    abacateId: input.abacateId,
    amount: input.amount,
    status: "pending",
    createdAt: now(),
    paidAt: null,
  };
  await es.index({
    index: IDX.payments,
    id: payment.id,
    document: payment,
    refresh: "wait_for",
  });
  return payment;
}

export async function getPayment(id: string): Promise<Payment | null> {
  await ready();
  try {
    const res = await es.get<Payment>({ index: IDX.payments, id });
    return res._source ?? null;
  } catch {
    return null;
  }
}

export async function findPaymentByAbacateId(
  abacateId: string,
): Promise<Payment | null> {
  await ready();
  const res = await es.search<Payment>({
    index: IDX.payments,
    size: 1,
    query: { term: { abacateId } },
  });
  return res.hits.hits[0]?._source ?? null;
}

export async function markPaymentPaid(id: string): Promise<void> {
  await ready();
  await es.update({
    index: IDX.payments,
    id,
    doc: { status: "paid", paidAt: now() },
    refresh: "wait_for",
  });
}

// Grant (or extend) 30 days of Pro from now.
export async function grantProFor30Days(userId: string): Promise<void> {
  const user = await getUser(userId);
  const base =
    user?.planUntil && new Date(user.planUntil).getTime() > Date.now()
      ? new Date(user.planUntil)
      : new Date();
  base.setDate(base.getDate() + 30);
  await setUserPlan(userId, "pro", base.toISOString());
}
