// Backend spine E2E: user -> app -> scan (real engine) -> findings in ES.
// Run: npx tsx scripts/e2e-backend.ts
import { createUser, createApp, getScan, listFindings } from "../lib/repo";
import { runScan } from "../lib/scan-runner";

async function main() {
  const email = `e2e_${Date.now()}@test.local`;
  const user = await createUser({
    name: "E2E Tester",
    email,
    password: "supersecret123",
  });
  console.log("user:", user.id, user.email);

  const app = await createApp(user.id, {
    name: "example",
    url: "https://example.com",
  });
  console.log("app:", app.id, app.url);

  console.time("scan");
  const scan = await runScan(app);
  console.timeEnd("scan");
  console.log("scan status:", scan.status, "grade:", scan.grade, "score:", scan.score);
  console.log("counts:", JSON.stringify(scan.counts));

  const persisted = await getScan(scan.id);
  const findings = await listFindings(scan.id);
  console.log("persisted scan status:", persisted?.status);
  console.log(`findings persisted in ES: ${findings.length}`);
  for (const f of findings.slice(0, 6)) {
    console.log(`  [${f.severity}] ${f.category} — ${f.title}`);
  }
  console.log(scan.status === "done" ? "\nE2E OK ✅" : "\nE2E FAILED ❌");
  process.exit(scan.status === "done" ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
