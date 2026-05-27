/**
 * repairBunnyMirror.ts
 *
 * Walks every "published" entry in articles/index.json, downloads the
 * matching articles/<slug>.json, and demotes any slug whose body, heroUrl,
 * or wordCount looks like a placeholder back to status=queued. Re-uploads
 * each affected per-slug JSON and rebuilds index.json once at the end.
 *
 * Run:
 *   pnpm tsx server/scripts/repairBunnyMirror.ts
 */
import "dotenv/config";
import { bunnyPut } from "../lib/bunny";
import { SITE } from "../lib/siteConfig";
import type { IndexJson, IndexEntry, StoredArticle } from "../lib/articleStore";

const INDEX_KEY = "articles/index.json";
const PULL = SITE.bunny.pullZone;

async function getJson<T>(url: string): Promise<T | null> {
  const r = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
  if (!r.ok) return null;
  return (await r.json()) as T;
}

function isPlaceholder(a: StoredArticle): boolean {
  const body = typeof a.body === "string" ? a.body.trim() : "";
  const hero = typeof a.heroUrl === "string" ? a.heroUrl : "";
  const words = a.wordCount ?? 0;
  if (body.length < 200) return true;
  if (!/^https?:\/\//.test(hero)) return true;
  if (words < 200) return true;
  return false;
}

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
  const published = idx.articles.filter((a) => a.status === "published");
  console.log(`scanning ${published.length} published entries…`);

  const toDemote: { entry: IndexEntry; row: StoredArticle }[] = [];
  for (const e of published) {
    const row = await getJson<StoredArticle>(`${PULL}/articles/${e.slug}.json`);
    if (!row) {
      console.log(`  unreachable: ${e.slug}`);
      continue;
    }
    if (isPlaceholder(row)) {
      console.log(`  placeholder: ${e.slug} (words=${row.wordCount}, bodyLen=${row.body?.length ?? 0}, hero=${row.heroUrl?.slice(0, 40)})`);
      toDemote.push({ entry: e, row });
    }
  }

  if (toDemote.length === 0) {
    console.log("nothing to repair — every published article looks real");
    return;
  }
  console.log(`demoting ${toDemote.length} placeholder(s) back to queued…`);

  const nowIso = new Date().toISOString();
  // 1) re-upload each per-slug JSON with status=queued, publishedAt=null
  for (const { entry, row } of toDemote) {
    const fixed: StoredArticle = {
      ...row,
      status: "queued",
      publishedAt: null,
      lastModifiedAt: nowIso,
    };
    const r = await bunnyPut(
      `articles/${entry.slug}.json`,
      Buffer.from(JSON.stringify(fixed, null, 2), "utf8"),
      "application/json",
    );
    console.log(`  per-slug ${entry.slug} → ${r.status}`);
  }

  // 2) rebuild index.json
  const demotedSet = new Set(toDemote.map((d) => d.entry.slug));
  const newArticles: IndexEntry[] = idx.articles.map((a) =>
    demotedSet.has(a.slug)
      ? { ...a, status: "queued", publishedAt: null, lastModifiedAt: nowIso }
      : a,
  );
  newArticles.sort((a, b) => {
    if (a.status !== b.status) return a.status === "published" ? -1 : 1;
    if (a.status === "published") {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    }
    return a.slug.localeCompare(b.slug);
  });
  const totalPublished = newArticles.filter((a) => a.status === "published").length;
  const totalQueued = newArticles.filter((a) => a.status === "queued").length;
  const newIndex: IndexJson = {
    schemaVersion: 1,
    generatedAt: nowIso,
    totalPublished,
    totalQueued,
    cdnHost: PULL,
    articles: newArticles,
  };
  const ir = await bunnyPut(
    INDEX_KEY,
    Buffer.from(JSON.stringify(newIndex, null, 2), "utf8"),
    "application/json",
  );
  console.log(
    `index.json rewritten → status=${ir.status} published=${totalPublished} queued=${totalQueued}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
