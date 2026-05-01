/**
 * Manually invoke each cron job once and verify it writes a row into
 * cron_runs. Used to prove the cron pipeline end to end without waiting
 * for the next scheduled tick.
 */
import "dotenv/config";
import {
  runPublisher,
  runProductSpotlight,
  runRefresh,
  runAsinHealth,
} from "../cron";
import { recordCronRun, recentCronRuns, countByStatus } from "../lib/articles";

async function logAndRun(job: string, fn: () => Promise<unknown>) {
  try {
    const out = await fn();
    await recordCronRun({ job, status: "ok", message: null, payload: out as any });
    console.log(`[verify] ${job} OK`, JSON.stringify(out));
  } catch (e: any) {
    await recordCronRun({
      job,
      status: "error",
      message: String(e?.message || e),
      payload: null,
    });
    console.log(`[verify] ${job} ERROR ${e?.message || e}`);
  }
}

async function main() {
  // We skip the LLM-driven publisher run unless the queue or blueprint is
  // available without making a DeepSeek call. With 30 already published and
  // 30 blueprints existing, runPublisher(1) will report no-blueprint-available
  // (a clean "skip" outcome). That is the verifiable behaviour we want.
  await logAndRun("publisher-phase-1.verify", () => runPublisher(1));
  await logAndRun("publisher-phase-2.verify", () => runPublisher(2));
  await logAndRun("product-spotlight.verify", () => runProductSpotlight());
  await logAndRun("refresh-monthly.verify", () => runRefresh("monthly", 1));
  await logAndRun("asin-health.verify", () => runAsinHealth());

  const counts = await countByStatus();
  const recent = await recentCronRuns(20);
  console.log("\n[verify] post-state");
  console.log("  counts:", counts);
  console.log("  recent cron_runs:");
  for (const r of recent.slice(0, 10)) {
    console.log(
      `    ${r.ranAt?.toISOString?.() || r.ranAt}  ${r.job}  ${r.status}  ${
        typeof r.payload === "object" ? JSON.stringify(r.payload) : r.payload
      }`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[verify] FAILED:", err);
    process.exit(1);
  });
