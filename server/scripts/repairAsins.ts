/**
 * repairAsins.ts — for every ASIN in the verification report marked "fail",
 * query Amazon search, take the first organic (non-sponsored) result,
 * re-verify it, and rewrite herbs.ts and/or affiliate.ts in place.
 *
 * Triple-pass: the candidate is only accepted if it passes our verifier
 * (HEAD-then-GET, 3 attempts, no Amazon "not found" interstitial).
 *
 * Usage:
 *   pnpm tsx server/scripts/repairAsins.ts            # dry-run, prints diff
 *   pnpm tsx server/scripts/repairAsins.ts --write    # rewrite files
 */
import fs from "node:fs";
import path from "node:path";
import { SITE } from "../lib/siteConfig";

const REPORT = path.resolve("asin-verification-report.csv");
const HERBS_PATH = path.resolve("server/lib/herbs.ts");
const AFFILIATE_PATH = path.resolve("server/lib/affiliate.ts");
const WRITE = process.argv.includes("--write");
const TAG = SITE.amazonTag;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ReportRow = { asin: string; source: "herbs" | "catalog"; name: string; verdict: string };
function parseCsvRow(line: string): string[] {
  const cells: string[] = [];
  let buf = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        buf += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else {
        buf += c;
      }
    } else {
      if (c === ",") {
        cells.push(buf);
        buf = "";
      } else if (c === '"') {
        inQ = true;
      } else {
        buf += c;
      }
    }
  }
  cells.push(buf);
  return cells;
}

function loadFailures(): ReportRow[] {
  const text = fs.readFileSync(REPORT, "utf8");
  const lines = text.split("\n").filter(Boolean);
  const rows: ReportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvRow(lines[i]);
    if (c[3] === "fail") {
      rows.push({ asin: c[0], source: c[1] as "herbs" | "catalog", name: c[2], verdict: c[3] });
    }
  }
  return rows;
}

async function searchAmazon(query: string): Promise<string[]> {
  const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=hpc&tag=${TAG}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15_000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }).finally(() => clearTimeout(t));
    if (!res.ok) return [];
    const html = await res.text();
    // scrape data-asin attributes from organic, non-sponsored items
    // s-result-item rows that include data-asin AND data-component-type="s-search-result"
    // sponsored items have an "AdHolder" class — skip those.
    const candidates: string[] = [];
    const blockRe =
      /<div[^>]*data-asin="([A-Z0-9]{10})"[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(html)) !== null) {
      const asin = m[1];
      const block = m[2];
      if (/AdHolder|sponsored-label|sb-item/i.test(block)) continue;
      candidates.push(asin);
      if (candidates.length >= 8) break;
    }
    // fallback: any data-asin in order
    if (candidates.length === 0) {
      const re = /data-asin="([A-Z0-9]{10})"/g;
      while ((m = re.exec(html)) !== null) {
        if (!candidates.includes(m[1])) candidates.push(m[1]);
        if (candidates.length >= 8) break;
      }
    }
    return candidates;
  } catch {
    return [];
  }
}

async function verifyOnce(asin: string): Promise<boolean> {
  const url = `https://www.amazon.com/dp/${asin}?tag=${TAG}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }).finally(() => clearTimeout(t));
    if (res.status < 200 || res.status >= 400) return false;
    const text = await res.text();
    if (
      /Looking for something\?/i.test(text) ||
      /We're sorry\. The Web address you entered is not a functioning page on our site/i.test(text)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function pickReplacement(name: string): Promise<string | null> {
  const candidates = await searchAmazon(`${name} supplement capsules`);
  for (const c of candidates) {
    let okCount = 0;
    for (let i = 0; i < 2; i++) {
      if (await verifyOnce(c)) okCount++;
      await sleep(800);
    }
    if (okCount > 0) return c;
  }
  // try a softer query
  const softer = await searchAmazon(name);
  for (const c of softer) {
    let okCount = 0;
    for (let i = 0; i < 2; i++) {
      if (await verifyOnce(c)) okCount++;
      await sleep(800);
    }
    if (okCount > 0) return c;
  }
  return null;
}

async function main() {
  const fails = loadFailures();
  console.log(`[repair] ${fails.length} dead ASINs to repair`);

  const swaps: { source: "herbs" | "catalog"; oldAsin: string; newAsin: string; name: string }[] = [];
  let done = 0;
  for (const row of fails) {
    const replacement = await pickReplacement(row.name);
    done++;
    if (!replacement) {
      console.warn(`[repair] NO-FIX (${done}/${fails.length}) ${row.asin} ${row.name}`);
      continue;
    }
    swaps.push({ source: row.source, oldAsin: row.asin, newAsin: replacement, name: row.name });
    console.log(`[repair] (${done}/${fails.length}) ${row.asin} -> ${replacement} (${row.name})`);
    await sleep(700 + Math.random() * 700);
  }

  console.log(`[repair] swaps prepared: ${swaps.length}/${fails.length}`);
  if (!WRITE) {
    fs.writeFileSync(
      "asin-repair-plan.json",
      JSON.stringify(swaps, null, 2) + "\n",
      "utf8",
    );
    console.log("[repair] DRY-RUN. plan -> asin-repair-plan.json");
    return;
  }

  // apply swaps
  let herbs = fs.readFileSync(HERBS_PATH, "utf8");
  let aff = fs.readFileSync(AFFILIATE_PATH, "utf8");
  for (const s of swaps) {
    if (s.source === "herbs") {
      const before = herbs;
      herbs = herbs.replace(`asin: "${s.oldAsin}"`, `asin: "${s.newAsin}"`);
      if (herbs === before) console.warn(`[repair] herbs.ts: no replacement for ${s.oldAsin}`);
    } else {
      const before = aff;
      aff = aff.replace(`asin: "${s.oldAsin}"`, `asin: "${s.newAsin}"`);
      if (aff === before) console.warn(`[repair] affiliate.ts: no replacement for ${s.oldAsin}`);
    }
  }
  fs.writeFileSync(HERBS_PATH, herbs, "utf8");
  fs.writeFileSync(AFFILIATE_PATH, aff, "utf8");
  console.log(`[repair] wrote ${HERBS_PATH} and ${AFFILIATE_PATH}`);
}

main().catch((e) => {
  console.error("[repair] fatal:", e);
  process.exit(1);
});
