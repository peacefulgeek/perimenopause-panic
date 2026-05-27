/**
 * articleJson.ts — mirror every article as a static JSON artifact on Bunny.
 *
 * Each published article is written to:
 *   https://perimenopause.b-cdn.net/articles/<slug>.json
 *
 * The JSON payload is a stable, public-safe shape (no DB ids, no internal
 * link arrays that include private fields) so it can be consumed by:
 *   - the live site as a hot-cache fallback
 *   - the LLM ecosystem (GPTBot, ClaudeBot, PerplexityBot, Google-Extended)
 *   - downstream syndication / RSS / static site exports
 *
 * The uploader is best-effort: if Bunny is unreachable or BUNNY_API_KEY is
 * missing, we log and return ok=false. We never throw — the DB row is the
 * source of truth and the article is still served by the Express app.
 */
import type { Article } from "../../drizzle/schema";
import { SITE } from "./siteConfig";
import { bunnyPut } from "./bunny";

export type ArticleJsonPayload = {
  schemaVersion: 1;
  site: { name: string; apex: string; apexUrl: string };
  author: { name: string; site: string; title: string };
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
};

/** Build the public JSON payload from a DB row. Pure function — easy to test. */
export function buildArticleJsonPayload(row: Article): ArticleJsonPayload {
  const canonical = `${SITE.apexUrl}/articles/${row.slug}`;
  const jsonUrl = `${SITE.bunny.pullZone}/articles/${row.slug}.json`;
  return {
    schemaVersion: 1,
    site: { name: SITE.name, apex: SITE.apex, apexUrl: SITE.apexUrl },
    author: {
      name: SITE.authorName,
      site: SITE.authorSite,
      title: SITE.authorTitle,
    },
    slug: row.slug,
    title: row.title,
    metaDescription: row.metaDescription,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    category: row.category,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    imageAlt: row.imageAlt,
    heroUrl: row.heroUrl,
    readingTime: row.readingTime,
    wordCount: row.wordCount,
    status: row.status,
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
    lastModifiedAt: new Date(row.lastModifiedAt).toISOString(),
    tldr: row.tldr,
    body: row.body,
    opener: row.opener,
    conclusion: row.conclusion,
    asinsUsed: Array.isArray(row.asinsUsed) ? (row.asinsUsed as string[]) : [],
    internalLinksUsed: Array.isArray(row.internalLinksUsed)
      ? (row.internalLinksUsed as string[])
      : [],
    canonical,
    jsonUrl,
  };
}

/** Path inside the Bunny storage zone. Used for both PUT and the public URL. */
export function articleJsonKey(slug: string): string {
  return `articles/${slug}.json`;
}

/** Public CDN URL for the JSON artifact. */
export function articleJsonUrl(slug: string): string {
  return `${SITE.bunny.pullZone}/${articleJsonKey(slug)}`;
}

export type UploadResult = {
  ok: boolean;
  status: number;
  url: string;
  reason?: string;
};

/**
 * Upload (or refresh) the JSON artifact for one article. Best-effort —
 * never throws. Returns { ok:false, reason } on missing creds or transport
 * failure so callers can decide whether to retry / log.
 */
export async function uploadArticleJson(row: Article): Promise<UploadResult> {
  const slug = row.slug;
  const url = articleJsonUrl(slug);
  if (!process.env.BUNNY_API_KEY) {
    return { ok: false, status: 0, url, reason: "missing-bunny-api-key" };
  }
  try {
    const payload = buildArticleJsonPayload(row);
    const body = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
    const res = await bunnyPut(articleJsonKey(slug), body, "application/json");
    return res.ok
      ? { ok: true, status: res.status, url: res.url }
      : { ok: false, status: res.status, url: res.url, reason: `bunny-${res.status}` };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      url,
      reason: err instanceof Error ? err.message : "unknown-error",
    };
  }
}
