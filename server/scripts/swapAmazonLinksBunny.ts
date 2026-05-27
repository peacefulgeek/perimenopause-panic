/**
 * swapAmazonLinksBunny.ts
 *
 * Walks every article JSON on Bunny CDN, replaces every direct
 * <a href="https://www.amazon.com/dp/{ASIN}/?tag=…"> link inside the body
 * with an Amazon SEARCH link using the link text as the query. Search links
 * always resolve to a real, current results page with the affiliate tag
 * attached, so they cannot 404 even if a single ASIN is retired.
 *
 * Run:
 *   pnpm tsx server/scripts/swapAmazonLinksBunny.ts
 */
import "dotenv/config";
import { bunnyPut } from "../lib/bunny";
import { SITE } from "../lib/siteConfig";
import type { IndexJson, StoredArticle } from "../lib/articleStore";

const PULL = SITE.bunny.pullZone;
const TAG = "spankyspinola-20";
const INDEX_KEY = "articles/index.json";

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

const RE = /<a\s+href="https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]+\/?\?tag=[\w-]+"([^>]*)>([^<]+)<\/a>/g;

async function main() {
  if (!process.env.BUNNY_API_KEY) {
    console.error("BUNNY_API_KEY missing");
    process.exit(1);
  }
  const idx = await getJson<IndexJson>(`${PULL}/${INDEX_KEY}`);
  if (!idx || !Array.isArray(idx.articles)) {
    console.error("index.json unreachable");
    process.exit(1);
  }
  const targets = idx.articles.filter((a) => a.status === "published");
  console.log(`scanning ${targets.length} published articles…`);

  let touched = 0;
  let totalSwaps = 0;
  for (const e of targets) {
    const a = await getJson<StoredArticle>(`${PULL}/articles/${e.slug}.json`);
    if (!a || !a.body) continue;
    let swaps = 0;
    const newBody = a.body.replace(RE, (_m, attrs: string, text: string) => {
      swaps++;
      const q = encodeURIComponent(text.trim());
      return `<a href="https://www.amazon.com/s?k=${q}&tag=${TAG}"${attrs}>${text}</a>`;
    });
    if (swaps === 0) continue;
    totalSwaps += swaps;
    touched++;
    const updated: StoredArticle = { ...a, body: newBody, lastModifiedAt: new Date().toISOString() };
    const r = await bunnyPut(
      `articles/${e.slug}.json`,
      Buffer.from(JSON.stringify(updated, null, 2), "utf8"),
      "application/json",
    );
    console.log(`  ${e.slug}  swaps=${swaps}  status=${r.status}`);
  }
  console.log(`done. articles touched=${touched}  total link swaps=${totalSwaps}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
