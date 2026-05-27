#!/usr/bin/env node
// scripts/asin/run.mjs
// Single entrypoint. Run from repo root on a normal residential IP:
//   node scripts/asin/run.mjs
// Or:
//   node scripts/asin/run.mjs --dry-run --only=herbs --limit=20

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { verifyAsinTriple } from "./verifier.mjs";
import { loadAllEntries, applySwaps } from "./files.mjs";
import { pickCandidates } from "./swap-pool.mjs";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const REPORT_PATH = path.join(ROOT, "scripts", "asin", "report.csv");

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const DRY = args.has("dry-run");
const ONLY = args.get("only"); // "herbs" | "catalog" | undefined
const LIMIT = parseInt(args.get("limit") || "0", 10) || 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (a, b) => a + Math.random() * (b - a);

function csvEscape(s) {
  const v = String(s ?? "");
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

async function main() {
  let entries = loadAllEntries();
  if (ONLY) entries = entries.filter((e) => e.source === ONLY);
  if (LIMIT > 0) entries = entries.slice(0, LIMIT);

  console.log(
    `[asin] starting   total=${entries.length}   dry=${DRY}   only=${ONLY || "all"}`,
  );

  const swaps = [];
  const rows = [
    ["asin", "source", "name", "verdict", "p1", "p2", "p3", "replacement", "detail"],
  ];
  let verified = 0;
  let swapped = 0;
  let manual = 0;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    process.stdout.write(
      `[${i + 1}/${entries.length}] ${e.source}/${e.slug || e.name} ${e.asin} ... `,
    );
    const triple = await verifyAsinTriple(e.asin, e.expectKeywords);
    const p = triple.passes;
    if (triple.verdict === "ok") {
      verified++;
      rows.push([
        e.asin,
        e.source,
        e.name || e.slug,
        "ok",
        p[0]?.detail || p[0]?.title || "ok",
        p[1]?.detail || "",
        p[2]?.detail || "",
        "",
        "",
      ]);
      console.log("ok");
    } else {
      // try swap pool
      const candidates = pickCandidates(e.name || e.slug || "");
      let replacement = null;
      let replacementDetail = "no-pool-candidate";
      for (const c of candidates) {
        if (c === e.asin) continue;
        await sleep(jitter(800, 1600));
        const t2 = await verifyAsinTriple(c, e.expectKeywords);
        if (t2.verdict === "ok") {
          replacement = c;
          replacementDetail = t2.passes[0]?.title || "ok";
          break;
        }
      }
      if (replacement) {
        swapped++;
        verified++;
        swaps.push({ source: e.source, oldAsin: e.asin, newAsin: replacement });
        rows.push([
          e.asin,
          e.source,
          e.name || e.slug,
          "swapped",
          p[0]?.detail || "",
          p[1]?.detail || "",
          p[2]?.detail || "",
          replacement,
          replacementDetail,
        ]);
        console.log(`swap → ${replacement}`);
      } else {
        manual++;
        rows.push([
          e.asin,
          e.source,
          e.name || e.slug,
          "manual",
          p[0]?.detail || "",
          p[1]?.detail || "",
          p[2]?.detail || "",
          "",
          replacementDetail,
        ]);
        console.log("MANUAL");
      }
    }
    await sleep(jitter(900, 1700));
  }

  // Write report
  fs.writeFileSync(
    REPORT_PATH,
    rows.map((r) => r.map(csvEscape).join(",")).join("\n"),
    "utf8",
  );

  // Apply swaps
  if (!DRY && swaps.length > 0) {
    const reports = applySwaps(swaps, { write: true });
    for (const r of reports) {
      console.log(`[asin] wrote ${r.changed} swaps to ${path.relative(ROOT, r.file)}`);
    }
  } else if (DRY && swaps.length > 0) {
    console.log(`[asin] DRY-RUN — ${swaps.length} swaps NOT written. Re-run without --dry-run to apply.`);
  }

  console.log(
    `[asin] done   total=${entries.length}   verified=${verified}   swapped=${swapped}   manual=${manual}   report=${path.relative(ROOT, REPORT_PATH)}`,
  );
}

main().catch((e) => {
  console.error("[asin] fatal", e);
  process.exit(1);
});
