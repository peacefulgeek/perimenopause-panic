/**
 * verifyAllAsins.ts — triple-pass HEAD verification of every ASIN in the
 * repo (herbs.ts + affiliate.ts), tagged with our affiliate code, with
 * polite backoff and a CSV report of any failures.
 *
 * Pass: 2xx OR 3xx (Amazon redirects to product page)
 * Fail: 4xx (404 = product gone) OR repeated network error
 *
 * We only flag a verdict of "fail" after THREE consecutive failures across
 * three passes with 1.5s+ jitter. Anything else is "ok".
 *
 * Output: /home/ubuntu/perimenopause-panic/asin-verification-report.csv
 *         columns: asin,source,verdict,p1,p2,p3,detail
 */
import fs from "node:fs";
import path from "node:path";
import { CATALOG } from "../lib/affiliate";
import { HERBS } from "../lib/herbs";
import { SITE } from "../lib/siteConfig";

type Source = "herbs" | "catalog";

const TAG = SITE.amazonTag;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

type Item = { asin: string; source: Source; name: string };

const items: Item[] = [];
for (const p of CATALOG) items.push({ asin: p.asin, source: "catalog", name: p.name });
for (const h of HERBS) items.push({ asin: h.asin, source: "herbs", name: h.name });

// dedupe by asin (catalog wins if dup)
const byAsin = new Map<string, Item>();
for (const it of items) if (!byAsin.has(it.asin)) byAsin.set(it.asin, it);
const unique = Array.from(byAsin.values());
console.log(`[verify] ${unique.length} unique ASINs (catalog=${CATALOG.length}, herbs=${HERBS.length})`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function probe(asin: string): Promise<{ ok: boolean; status: number | string; detail?: string }> {
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
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }).finally(() => clearTimeout(t));
    if (res.status >= 200 && res.status < 400) {
      // Some 200 responses are the "page not found" / "Sorry, we couldn't
      // find that page" interstitial. Detect it from the URL or body.
      const finalUrl = res.url || url;
      if (/\/errors\//.test(finalUrl) || /\/dp\/(?:404|deadasin)/.test(finalUrl)) {
        return { ok: false, status: res.status, detail: `interstitial:${finalUrl}` };
      }
      const text = await res.text();
      if (
        /Looking for something\?/i.test(text) ||
        /We're sorry\. The Web address you entered is not a functioning page on our site/i.test(text) ||
        /Page Not Found/i.test(text.split("</title>")[0] ?? "")
      ) {
        return { ok: false, status: res.status, detail: "amazon-not-found-page" };
      }
      return { ok: true, status: res.status };
    }
    return { ok: false, status: res.status };
  } catch (e: any) {
    return { ok: false, status: "ERR", detail: String(e?.name || e) };
  }
}

type Row = {
  asin: string;
  source: Source;
  name: string;
  p1: string;
  p2: string;
  p3: string;
  verdict: "ok" | "fail";
  detail: string;
};

async function main() {
  const concurrency = 6;
  const rows: Row[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= unique.length) return;
      const it = unique[i];
      const passes: { ok: boolean; status: number | string; detail?: string }[] = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        const r = await probe(it.asin);
        passes.push(r);
        if (r.ok) break; // a single OK is enough — but we still record it
        await sleep(1500 + Math.random() * 1500);
      }
      const okCount = passes.filter((p) => p.ok).length;
      // Triple-pass spec: ok if any pass returned ok, fail only when all
      // three independent attempts failed.
      const verdict: "ok" | "fail" = okCount > 0 ? "ok" : "fail";
      const detail = passes.find((p) => !p.ok)?.detail ?? "";
      rows.push({
        asin: it.asin,
        source: it.source,
        name: it.name,
        p1: String(passes[0]?.status ?? ""),
        p2: String(passes[1]?.status ?? ""),
        p3: String(passes[2]?.status ?? ""),
        verdict,
        detail,
      });
      if (verdict === "fail") {
        console.warn(`[verify] FAIL ${it.asin} (${it.source}: ${it.name})`);
      } else if (rows.length % 25 === 0) {
        console.log(`[verify] progress ${rows.length}/${unique.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  rows.sort((a, b) => (a.verdict === b.verdict ? a.asin.localeCompare(b.asin) : a.verdict === "fail" ? -1 : 1));

  const out = path.resolve("asin-verification-report.csv");
  const lines = ["asin,source,name,verdict,p1,p2,p3,detail"];
  for (const r of rows) {
    const safe = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
    lines.push([r.asin, r.source, safe(r.name), r.verdict, r.p1, r.p2, r.p3, safe(r.detail)].join(","));
  }
  fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
  const failCount = rows.filter((r) => r.verdict === "fail").length;
  console.log(`[verify] done. total=${rows.length} ok=${rows.length - failCount} fail=${failCount} report=${out}`);
}

main().catch((e) => {
  console.error("[verify] fatal:", e);
  process.exit(1);
});
