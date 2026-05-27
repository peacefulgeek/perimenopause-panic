import { HERBS } from "../lib/herbs";

/**
 * Verify every herb ASIN resolves to a real Amazon product page.
 *
 * We do a HEAD on https://www.amazon.com/dp/{ASIN}/?tag={SITE.amazonTag}
 * and accept 200/301/302 as "live". Anything else is flagged.
 *
 * Note: Amazon often returns 503 to bot user agents. We retry with a
 * desktop user agent and only flag persistent non-2xx/3xx after 2 tries.
 */

import { SITE } from "../lib/siteConfig";

const TAG = SITE.amazonTag;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

async function checkAsin(asin: string): Promise<{ ok: boolean; status: number; finalUrl?: string }> {
  const url = `https://www.amazon.com/dp/${asin}/?tag=${TAG}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(15_000),
      });
      // Amazon redirects unknown ASINs to the homepage. We sniff the
      // returned URL: if it ends up at /dp/{asin} we're good, if it ends
      // up at the homepage or a 404 page we're not.
      const finalUrl = r.url;
      const looksLikeProductPage =
        finalUrl.includes(`/dp/${asin}`) ||
        finalUrl.includes(`/gp/product/${asin}`);
      if (r.ok && looksLikeProductPage) {
        return { ok: true, status: r.status, finalUrl };
      }
      if (r.ok && !looksLikeProductPage) {
        return { ok: false, status: r.status, finalUrl };
      }
      // Non-OK: try once more after a small delay
      await new Promise((res) => setTimeout(res, 800));
    } catch (e) {
      // network/timeout — retry
      await new Promise((res) => setTimeout(res, 800));
    }
  }
  return { ok: false, status: 0 };
}

async function main() {
  console.log(`Auditing ${HERBS.length} ASINs through tag=${TAG}...\n`);
  const results: { slug: string; asin: string; ok: boolean; status: number; finalUrl?: string }[] = [];
  // Run in batches of 8 to stay polite
  const batchSize = 8;
  for (let i = 0; i < HERBS.length; i += batchSize) {
    const batch = HERBS.slice(i, i + batchSize);
    const settled = await Promise.all(
      batch.map(async (h) => ({ slug: h.slug, asin: h.asin, ...(await checkAsin(h.asin)) }))
    );
    results.push(...settled);
    process.stdout.write(`  ${results.length}/${HERBS.length}\r`);
  }
  console.log(`\n`);

  const live = results.filter((r) => r.ok);
  const dead = results.filter((r) => !r.ok);
  console.log(`=== ASIN AUDIT RESULT ===`);
  console.log(`  total ASINs:     ${results.length}`);
  console.log(`  live products:   ${live.length}`);
  console.log(`  flagged (need swap): ${dead.length}`);
  if (dead.length > 0) {
    console.log(`\nFlagged ASINs:`);
    for (const r of dead) {
      console.log(`  - ${r.slug}  (${r.asin})  status=${r.status}  final=${r.finalUrl ?? "n/a"}`);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
