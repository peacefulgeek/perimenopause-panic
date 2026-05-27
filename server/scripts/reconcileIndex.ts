/**
 * reconcileIndex.ts
 *
 * Single source of truth: the per-slug JSON files on Bunny. For every entry
 * in articles/index.json, fetch the article, look at its body and
 * publishedAt, decide its true status:
 *   - If body length >= 200 chars AND wordCount >= 200 -> published
 *   - Otherwise -> queued (revert any spurious "published" flag)
 *
 * Then recompute totalPublished/totalQueued, write the index, and purge
 * the Bunny edge cache via the Bunny CDN purge API.
 */
import "dotenv/config";
import { bunnyPut } from "../lib/bunny";
import { SITE } from "../lib/siteConfig";
import type { IndexJson, IndexEntry, StoredArticle } from "../lib/articleStore";

const PULL = SITE.bunny.pullZone;
const INDEX_KEY = "articles/index.json";
const STORAGE_HOST =
  process.env.BUNNY_STORAGE_HOST || SITE.bunny.storageHost;
const STORAGE_ZONE =
  process.env.BUNNY_STORAGE_ZONE || SITE.bunny.storageZone;
const API_KEY = process.env.BUNNY_API_KEY!;

async function getJson<T>(url: string): Promise<T | null> {
  const sep = url.includes("?") ? "&" : "?";
  const r = await fetch(`${url}${sep}b=${Date.now()}${Math.random()}`, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  if (!r.ok) return null;
  return (await r.json()) as T;
}

/** Read the index directly from the storage origin, bypassing edge caches. */
async function getIndexFromOrigin(): Promise<IndexJson | null> {
  const url = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${INDEX_KEY}`;
  const r = await fetch(url, {
    headers: { AccessKey: API_KEY, "Cache-Control": "no-cache" },
  });
  if (!r.ok) {
    console.error(`origin index fetch failed ${r.status}`);
    return null;
  }
  return (await r.json()) as IndexJson;
}

async function getArticleFromOrigin(slug: string): Promise<StoredArticle | null> {
  const url = `https://${STORAGE_HOST}/${STORAGE_ZONE}/articles/${slug}.json`;
  const r = await fetch(url, {
    headers: { AccessKey: API_KEY, "Cache-Control": "no-cache" },
  });
  if (!r.ok) return null;
  try {
    return (await r.json()) as StoredArticle;
  } catch {
    return null;
  }
}

async function purgePullZone() {
  // Bunny CDN-wide purge: we trigger via the purge URL endpoint with the
  // pullzone host. We purge the index plus a wildcard for /articles/*.
  // The Bunny purge API uses the same API key.
  const targets = [
    `${PULL}/articles/index.json`,
    `${PULL}/articles/`,
  ];
  for (const t of targets) {
    const u = `https://api.bunny.net/purge?url=${encodeURIComponent(t)}&async=false`;
    const r = await fetch(u, { headers: { AccessKey: API_KEY } });
    console.log(`  purge ${t}: ${r.status}`);
  }
}

async function main() {
  if (!API_KEY) {
    console.error("BUNNY_API_KEY missing");
    process.exit(1);
  }
  const idx = await getIndexFromOrigin();
  if (!idx) {
    console.error("could not read index from origin");
    process.exit(1);
  }
  // Only check entries currently flagged as published. Queued entries we
  // don't touch — they stay queued by definition.
  const toCheck = idx.articles.filter((e) => e.status === "published");
  console.log(`Source-of-truth check on ${toCheck.length} published entries (of ${idx.articles.length} total)…`);
  const truthMap = new Map<string, "published" | "queued">();
  // 8-way parallel fetch
  const queue = [...toCheck];
  async function worker() {
    while (queue.length) {
      const e = queue.shift();
      if (!e) return;
      const a = await getArticleFromOrigin(e.slug);
      const isReal =
        !!a && !!a.body && a.body.trim().length >= 200 && (a.wordCount || 0) >= 200;
      truthMap.set(e.slug, isReal ? "published" : "queued");
    }
  }
  await Promise.all(Array.from({ length: 8 }, () => worker()));
  const next: IndexEntry[] = [];
  let flipped = 0;
  for (const e of idx.articles) {
    const truth = truthMap.get(e.slug);
    if (e.status === "published" && truth === "queued") {
      flipped++;
      console.log(`  demote: ${e.slug}`);
      next.push({ ...e, status: "queued", publishedAt: null });
    } else {
      next.push(e);
    }
  }
  // Recompute counts
  const totalPublished = next.filter((e) => e.status === "published").length;
  const totalQueued = next.filter((e) => e.status === "queued").length;
  const idxOut: IndexJson = {
    ...idx,
    articles: next,
    totalPublished,
    totalQueued,
  };
  // Upload
  const r = await bunnyPut(
    INDEX_KEY,
    Buffer.from(JSON.stringify(idxOut, null, 2), "utf8"),
    "application/json",
  );
  console.log(`\nuploaded index: status=${r.status}  pub=${totalPublished}  queued=${totalQueued}  flipped=${flipped}`);
  await purgePullZone();
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
