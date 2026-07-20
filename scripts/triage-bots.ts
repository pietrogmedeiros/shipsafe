// Bot-signup triage + cleanup for ShipSafe (prod).
//
// WHAT IT DOES
//   1. Loads every user, flags bot-signup patterns (Gmail dot/alias abuse,
//      random no-space display names).
//   2. For each suspect, pulls their apps + scans and flags any target that
//      points at an INTERNAL/private host — that's evidence the account tried
//      to use ShipSafe as an SSRF proxy.
//   3. Prints a report. With --delete it removes the suspects and all their
//      apps/scans/findings.
//
// SAFETY
//   - Dry-run by default. Deletion requires the explicit --delete flag.
//   - NEVER deletes the owner or any plan:"pro" account (paying customers).
//
// RUN (against PROD — creds are NOT in .env.local, pass them inline):
//   ELASTICSEARCH_URL="https://elastic.gob-dev.space" \
//   ELASTICSEARCH_USERNAME="elastic" ELASTICSEARCH_PASSWORD="******" \
//   node --experimental-strip-types scripts/triage-bots.ts          # report only
//   ...same env... node --experimental-strip-types scripts/triage-bots.ts --delete

import { Client } from "@elastic/elasticsearch";
import net from "node:net";

const OWNER_EMAIL = "pietrogoncalvesmedeiros@gmail.com";

// Minimal inline Gmail canonicalizer (mirrors lib/email.ts) so this standalone
// script has no cross-import; used only to reliably exclude the owner.
function canonicalizeEmail(raw: string): string {
  const e = raw.toLowerCase().trim();
  const at = e.lastIndexOf("@");
  if (at <= 0) return e;
  let local = e.slice(0, at);
  const domain = e.slice(at + 1);
  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${local.replace(/\./g, "")}@gmail.com`;
  }
  return `${local}@${domain}`;
}
const DELETE = process.argv.includes("--delete");

const IDX = {
  users: "shipsafe-users",
  apps: "shipsafe-apps",
  scans: "shipsafe-scans",
  findings: "shipsafe-findings",
};

const node = process.env.ELASTICSEARCH_URL;
if (!node || node.includes("localhost")) {
  console.error(
    "Refusing to run: set ELASTICSEARCH_URL to the PROD cluster (not localhost).",
  );
  process.exit(1);
}
const es = new Client({
  node,
  auth: process.env.ELASTICSEARCH_API_KEY
    ? { apiKey: process.env.ELASTICSEARCH_API_KEY }
    : {
        username: process.env.ELASTICSEARCH_USERNAME || "elastic",
        password: process.env.ELASTICSEARCH_PASSWORD || "",
      },
  tls: { rejectUnauthorized: true },
});

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  createdAt: string;
}

/** Is a hostname/URL pointed at an obviously-internal target? (evidence only) */
function targetsInternal(rawUrl: string): boolean {
  try {
    const h = new URL(rawUrl).hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (h === "localhost" || h.endsWith(".internal") || h.endsWith(".local"))
      return true;
    if (net.isIP(h)) {
      const p = h.split(".").map(Number);
      if (p.length === 4) {
        const [a, b] = p;
        return (
          a === 0 || a === 10 || a === 127 ||
          (a === 169 && b === 254) ||
          (a === 172 && b >= 16 && b <= 31) ||
          (a === 192 && b === 168) ||
          (a === 100 && b >= 64 && b <= 127)
        );
      }
      return h === "::1" || h.startsWith("fe80") || h.startsWith("fc") || h.startsWith("fd");
    }
    return false;
  } catch {
    return false;
  }
}

/** Heuristic bot-signup detector. Returns the reasons it looks automated. */
function botReasons(u: User): string[] {
  const reasons: string[] = [];
  const at = u.email.indexOf("@");
  const local = at > 0 ? u.email.slice(0, at) : u.email;
  const domain = at > 0 ? u.email.slice(at + 1).toLowerCase() : "";
  const isGmail = domain === "gmail.com" || domain === "googlemail.com";
  const dots = (local.match(/\./g) || []).length;
  if (isGmail && dots >= 3) reasons.push(`gmail w/ ${dots} dots (alias flood)`);
  if (isGmail && local.includes("+")) reasons.push("gmail +tag alias");
  const name = (u.name || "").trim();
  // Random display name: one long token, mixed case, no spaces, no vowels/space rhythm.
  if (/^[A-Za-z]{12,}$/.test(name) && /[a-z]/.test(name) && /[A-Z]/.test(name) && !name.includes(" ")) {
    reasons.push("random-looking name");
  }
  return reasons;
}

async function scrollAll<T>(index: string): Promise<{ id: string; src: T }[]> {
  const out: { id: string; src: T }[] = [];
  let res = await es.search<T>({ index, size: 1000, query: { match_all: {} }, scroll: "1m" });
  let sid = res._scroll_id;
  while (res.hits.hits.length) {
    for (const h of res.hits.hits) out.push({ id: h._id!, src: h._source as T });
    res = await es.scroll<T>({ scroll_id: sid!, scroll: "1m" });
    sid = res._scroll_id;
  }
  if (sid) await es.clearScroll({ scroll_id: sid }).catch(() => {});
  return out;
}

async function main() {
  const users = await scrollAll<User>(IDX.users);
  console.log(`\nTotal users: ${users.length}\n`);

  const suspects: { u: User; reasons: string[] }[] = [];
  for (const { src: u } of users) {
    if (canonicalizeEmail(u.email) === OWNER_EMAIL) continue;
    if (u.plan === "pro") continue; // never auto-touch paying accounts
    const reasons = botReasons(u);
    if (reasons.length) suspects.push({ u, reasons });
  }

  suspects.sort((a, b) => (a.u.createdAt < b.u.createdAt ? 1 : -1));
  console.log(`Bot-signup suspects: ${suspects.length}`);
  console.log("=".repeat(70));

  let ssrfHits = 0;
  for (const { u, reasons } of suspects) {
    console.log(`\n• ${u.email}  "${u.name}"  ${u.createdAt}`);
    console.log(`  id=${u.id}  reasons: ${reasons.join(", ")}`);

    const apps = await es.search<{ url: string }>({
      index: IDX.apps, size: 100, query: { term: { userId: u.id } },
    });
    const scans = await es.search<{ url: string; status: string }>({
      index: IDX.scans, size: 100, query: { term: { userId: u.id } },
    });
    for (const a of apps.hits.hits) {
      const url = a._source?.url || "";
      const flag = targetsInternal(url) ? "  ⚠️  INTERNAL TARGET (SSRF attempt)" : "";
      if (flag) ssrfHits++;
      if (url) console.log(`    app  → ${url}${flag}`);
    }
    for (const s of scans.hits.hits) {
      const url = s._source?.url || "";
      const flag = targetsInternal(url) ? "  ⚠️  INTERNAL TARGET (SSRF attempt)" : "";
      if (flag) ssrfHits++;
      if (url) console.log(`    scan → ${url} [${s._source?.status}]${flag}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`Suspects: ${suspects.length}   Internal-target hits: ${ssrfHits}`);

  if (!DELETE) {
    console.log("\nDRY RUN — nothing deleted. Re-run with --delete to remove suspects.");
    return;
  }

  console.log("\n--delete: removing suspects and their apps/scans/findings...");
  let removed = 0;
  for (const { u } of suspects) {
    for (const idx of [IDX.apps, IDX.scans, IDX.findings]) {
      await es.deleteByQuery({ index: idx, query: { term: { userId: u.id } }, refresh: true, conflicts: "proceed" }).catch(() => {});
    }
    await es.delete({ index: IDX.users, id: u.id, refresh: true }).catch(() => {});
    removed++;
  }
  console.log(`Removed ${removed} suspect accounts.`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
