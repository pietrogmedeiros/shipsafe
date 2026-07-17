import { ensureIndices, IDX } from "../lib/indices";
import { es } from "../lib/es";

async function main() {
  await ensureIndices();
  const health = await es.cluster.health();
  console.log("cluster:", health.status);
  for (const name of Object.values(IDX)) {
    const exists = await es.indices.exists({ index: name });
    console.log(`  ${name}: ${exists ? "ok" : "MISSING"}`);
  }
  console.log("indices ready");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
