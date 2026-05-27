/**
 * bunnyPublisher.ts — Bunny-only publisher primitive.
 *
 * The legacy cron in cron.ts mutates a MySQL DB. On Railway we don't have
 * a DB. This module provides the same conceptual operation without ever
 * touching a database:
 *
 *   1. Download articles/index.json
 *   2. Pick the next queued slug (FIFO by lastModifiedAt, then slug)
 *   3. Download articles/<slug>.json
 *   4. Set status=published, publishedAt=now, lastModifiedAt=now
 *   5. Re-upload articles/<slug>.json
 *   6. Rebuild and re-upload articles/index.json
 *
 * Returns the slug that was published, or null if there was nothing to do
 * (queue empty, Bunny unreachable, or BUNNY_API_KEY missing). Best-effort
 * everywhere — never throws to the caller.
 */
import { bunnyPut } from "./bunny";
import { SITE } from "./siteConfig";
import type { IndexJson, IndexEntry, StoredArticle } from "./articleStore";

const INDEX_KEY = "articles/index.json";

function articleKey(slug: string): string {
  return `articles/${slug}.json`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export type PublishOutcome = {
  ok: boolean;
  publishedSlug: string | null;
  reason?: string;
  totalPublished?: number;
  totalQueued?: number;
};

/**
 * Promote the next queued article to published.
 * Pure CDN operation, no DB.
 */
export async function bunnyPublishNext(): Promise<PublishOutcome> {
  if (!process.env.BUNNY_API_KEY) {
    return { ok: false, publishedSlug: null, reason: "missing-bunny-api-key" };
  }
  const indexUrl = `${SITE.bunny.pullZone}/${INDEX_KEY}`;
  const idx = await fetchJson<IndexJson>(indexUrl);
  if (!idx || !Array.isArray(idx.articles)) {
    return { ok: false, publishedSlug: null, reason: "index-unreachable" };
  }
  const queuedAll = idx.articles
    .filter((a) => a.status === "queued")
    .sort((a, b) => {
      const ta = Date.parse(a.lastModifiedAt) || 0;
      const tb = Date.parse(b.lastModifiedAt) || 0;
      if (ta !== tb) return ta - tb;
      return a.slug.localeCompare(b.slug);
    });
  if (queuedAll.length === 0) {
    return { ok: false, publishedSlug: null, reason: "queue-empty" };
  }

  // Walk queued entries until we find one whose per-slug JSON is fully
  // populated (body + heroUrl + non-trivial wordCount). Never promote a
  // placeholder. Cap the walk to avoid pathological loops.
  const MAX_WALK = 50;
  let next: IndexEntry | null = null;
  let article: StoredArticle | null = null;
  let skipped = 0;
  for (const cand of queuedAll.slice(0, MAX_WALK)) {
    const candidate = await fetchJson<StoredArticle>(
      `${SITE.bunny.pullZone}/${articleKey(cand.slug)}`,
    );
    if (!candidate) {
      skipped++;
      continue;
    }
    const hasBody =
      typeof candidate.body === "string" && candidate.body.trim().length > 200;
    const hasHero =
      typeof candidate.heroUrl === "string" &&
      /^https?:\/\//.test(candidate.heroUrl);
    const hasWords = (candidate.wordCount ?? 0) >= 200;
    if (!hasBody || !hasHero || !hasWords) {
      skipped++;
      continue;
    }
    next = cand;
    article = candidate;
    break;
  }
  if (!next || !article) {
    return {
      ok: false,
      publishedSlug: null,
      reason: `no-publishable-queued-article:skipped=${skipped}`,
    };
  }
  const nowIso = new Date().toISOString();
  const updated: StoredArticle = {
    ...article,
    status: "published",
    publishedAt: nowIso,
    lastModifiedAt: nowIso,
  };
  const articleUp = await bunnyPut(
    articleKey(next.slug),
    Buffer.from(JSON.stringify(updated, null, 2), "utf8"),
    "application/json",
  );
  if (!articleUp.ok) {
    return {
      ok: false,
      publishedSlug: null,
      reason: `article-upload-failed:${articleUp.status}`,
    };
  }

  // rebuild index — same slug now has status=published + new timestamps
  const newArticles: IndexEntry[] = idx.articles.map((a) =>
    a.slug === next.slug
      ? {
          ...a,
          status: "published",
          publishedAt: nowIso,
          lastModifiedAt: nowIso,
        }
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
    cdnHost: SITE.bunny.pullZone,
    articles: newArticles,
  };
  const indexUp = await bunnyPut(
    INDEX_KEY,
    Buffer.from(JSON.stringify(newIndex, null, 2), "utf8"),
    "application/json",
  );
  if (!indexUp.ok) {
    return {
      ok: false,
      publishedSlug: next.slug,
      reason: `index-upload-failed:${indexUp.status}`,
    };
  }

  return {
    ok: true,
    publishedSlug: next.slug,
    totalPublished,
    totalQueued,
  };
}
