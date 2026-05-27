/**
 * articleStore.ts — Bunny-only article reader for the live runtime.
 *
 * On Railway / production, the public site does NOT touch the database.
 * It reads articles from the public Bunny CDN:
 *
 *   https://perimenopause.b-cdn.net/articles/index.json     (list of slugs)
 *   https://perimenopause.b-cdn.net/articles/<slug>.json    (one article)
 *
 * Both endpoints are public. The fetcher uses an in-memory cache with a
 * configurable TTL so a busy day on the site doesn't translate into a DDoS
 * against Bunny. The cache also means a single article render does at most
 * one network round-trip per slug per TTL window.
 *
 * If Bunny is unreachable, the store returns null/[] and the route falls
 * back to a 404. We never throw to the request handler.
 */
import { SITE } from "./siteConfig";

export type StoredArticle = {
  schemaVersion: 1;
  slug: string;
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  category: string;
  tags: string[];
  imageAlt: string;
  heroUrl: string;
  readingTime: number;
  wordCount: number;
  status: "queued" | "published";
  publishedAt: string | null;
  lastModifiedAt: string;
  tldr: string;
  body: string;
  opener: string;
  conclusion: string;
  asinsUsed: string[];
  internalLinksUsed: string[];
  canonical: string;
  jsonUrl: string;
  author: { name: string; site: string; title: string };
  site: { name: string; apex: string; apexUrl: string };
};

export type IndexEntry = {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  lastModifiedAt: string;
  metaDescription: string;
  heroUrl: string;
  status: "queued" | "published";
  jsonUrl: string;
  wordCount: number;
};

export type IndexJson = {
  schemaVersion: 1;
  generatedAt: string;
  totalPublished: number;
  totalQueued: number;
  cdnHost: string;
  articles: IndexEntry[];
};

const TTL_MS = (() => {
  const raw = process.env.ARTICLE_CACHE_TTL_MS;
  if (!raw) return 5 * 60 * 1000;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 5 * 60 * 1000;
})();

type Cached<T> = { value: T; expiresAt: number };

const articleCache = new Map<string, Cached<StoredArticle | null>>();
let indexCache: Cached<IndexJson | null> | null = null;

function indexUrl(): string {
  return `${SITE.bunny.pullZone}/articles/index.json`;
}
function articleUrl(slug: string): string {
  return `${SITE.bunny.pullZone}/articles/${slug}.json`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    // Cache-bust cautiously: prefer Bunny's own cache headers, but force a
    // revalidation on every miss so Railway can't serve stale-forever.
    const r = await fetch(url, {
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** Public: get the full published-only article list from Bunny. */
export async function listPublishedFromBunny(): Promise<IndexEntry[]> {
  const idx = await getIndex();
  if (!idx) return [];
  return idx.articles
    .filter((a) => a.status === "published")
    .sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    });
}

/** Public: get one article (only returns it if status === "published"). */
export async function getArticleFromBunny(slug: string): Promise<StoredArticle | null> {
  const now = Date.now();
  const cached = articleCache.get(slug);
  if (cached && cached.expiresAt > now) return cached.value;
  const fetched = await fetchJson<StoredArticle>(articleUrl(slug));
  const value = fetched && fetched.status === "published" ? fetched : null;
  articleCache.set(slug, { value, expiresAt: now + TTL_MS });
  return value;
}

/** Public: get the index.json blob (cached). */
export async function getIndex(): Promise<IndexJson | null> {
  const now = Date.now();
  if (indexCache && indexCache.expiresAt > now) return indexCache.value;
  const fetched = await fetchJson<IndexJson>(indexUrl());
  indexCache = { value: fetched, expiresAt: now + TTL_MS };
  return fetched;
}

/** Public: counts derived from the Bunny index, used by /api/diagnostics. */
export async function countByStatusFromBunny(): Promise<{ published: number; queued: number }> {
  const idx = await getIndex();
  if (!idx) return { published: 0, queued: 0 };
  return { published: idx.totalPublished, queued: idx.totalQueued };
}

/** Used in tests and the seed script to clear the in-memory cache. */
export function _resetArticleStoreCacheForTests(): void {
  articleCache.clear();
  indexCache = null;
}
