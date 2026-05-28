import cron from "node-cron";
import {
  countByStatus,
  insertArticle,
  pickNextQueuedSlug,
  publishArticle,
  recordCronRun,
  listPublishedArticles,
} from "./lib/articles";
import { generateArticleHtml } from "./lib/generateArticle";
import { CATALOG } from "./lib/affiliate";
import { assignHeroImage } from "./lib/bunny";
import { ARTICLE_BLUEPRINTS } from "./lib/blueprints";
import { runQualityGate } from "./lib/qualityGate";
import { uploadArticleJson } from "./lib/articleJson";
import { getArticleBySlug } from "./lib/articles";
import { bunnyPublishNext } from "./lib/bunnyPublisher";
import { listPublishedFromBunny, getArticleFromBunny } from "./lib/articleStore";
import { bunnyPut } from "./lib/bunny";
import { callClaude } from "./lib/claude";
import { SITE } from "./lib/siteConfig";

const AUTO_GEN = (process.env.AUTO_GEN_ENABLED || "true").toLowerCase() === "true";
const TZ = "UTC";

/**
 * Published-article cap. Historically this was hard-capped at 100 to keep
 * costs predictable while the corpus matured. The cap is now removed: the
 * publisher will keep releasing queued items every scheduled slot with no
 * ceiling. The env var is still read so an operator can re-introduce a cap
 * later by setting PUBLISHED_CAP to a finite number; otherwise the value is
 * Infinity and the cap branch in runPublisher is effectively dead code.
 */
export const PUBLISHED_CAP = process.env.PUBLISHED_CAP
  ? parseInt(process.env.PUBLISHED_CAP, 10)
  : Infinity;

let started = false;

/**
 * Master scope §8 — phase-aware cron runner. Phase 1 (published<60): five
 * fires/day, every day. Phase 2 (published>=60): once weekday at 08:00 UTC.
 * Both schedules are registered; the handler reads the current phase and
 * acts only if the slot's allowedPhase matches.
 */
export function startCronRunner(): void {
  if (started) return;
  started = true;
  if (!AUTO_GEN) {
    console.log("[cron] AUTO_GEN_ENABLED disabled, cron not started");
    return;
  }

  // Phase 1: 07:00, 10:00, 13:00, 16:00, 19:00 UTC, every day
  cron.schedule(
    "0 7,10,13,16,19 * * *",
    () => safeRun("publisher-phase-1", () => runPublisher(1)),
    { timezone: TZ },
  );
  // Phase 2: weekday 08:00 UTC
  cron.schedule(
    "0 8 * * 1-5",
    () => safeRun("publisher-phase-2", () => runPublisher(2)),
    { timezone: TZ },
  );
  // Product spotlight: Saturday 08:00 UTC
  cron.schedule(
    "0 8 * * 6",
    () => safeRun("product-spotlight", () => runProductSpotlight()),
    { timezone: TZ },
  );
  // Monthly refresh: 1st of month 03:00 UTC
  cron.schedule(
    "0 3 1 * *",
    () => safeRun("refresh-monthly", () => runRefresh("monthly", 25)),
    { timezone: TZ },
  );
  // Quarterly refresh: Jan/Apr/Jul/Oct 1st 04:00 UTC
  cron.schedule(
    "0 4 1 1,4,7,10 *",
    () => safeRun("refresh-quarterly", () => runRefresh("quarterly", 20)),
    { timezone: TZ },
  );
  // ASIN health check: Sundays 05:00 UTC
  cron.schedule(
    "0 5 * * 0",
    () => safeRun("asin-health", () => runAsinHealth()),
    { timezone: TZ },
  );

  console.log("[cron] All schedules registered (AUTO_GEN_ENABLED=true)");
}

async function safeRun(job: string, fn: () => Promise<unknown>) {
  try {
    const out = await fn();
    if (process.env.DATABASE_URL) {
      await recordCronRun({ job, status: "ok", message: null, payload: (out as any) ?? null });
    } else {
      console.log(`[cron] ${job} ok (bunny-only)`, out);
    }
  } catch (e: any) {
    console.error(`[cron] ${job} failed:`, e);
    if (process.env.DATABASE_URL) {
      try {
        await recordCronRun({
          job,
          status: "error",
          message: String(e?.message || e),
          payload: null,
        });
      } catch {}
    }
  }
}

export async function runPublisher(allowedPhase: 1 | 2): Promise<{
  acted: boolean;
  reason?: string;
  publishedSlug?: string;
}> {
  // Bunny-only mode: when DATABASE_URL is unset (Railway runtime) we mutate
  // articles/index.json + articles/<slug>.json directly on Bunny instead of
  // touching a DB. The phase gate still applies, computed from the Bunny
  // counts in the index.
  if (!process.env.DATABASE_URL) {
    const r = await bunnyPublishNext();
    if (!r.ok) return { acted: false, reason: r.reason ?? "bunny-publish-failed" };
    return { acted: true, publishedSlug: r.publishedSlug ?? undefined };
  }
  const counts = await countByStatus();
  const publishedCount = counts.published || 0;
  // Optional cap. Only enforced when PUBLISHED_CAP is a finite number (the
  // default is Infinity, so the cap is off by default). Set the env var to a
  // positive integer to re-enable a ceiling without a code change.
  if (Number.isFinite(PUBLISHED_CAP) && publishedCount >= PUBLISHED_CAP) {
    return { acted: false, reason: `published-cap-reached:${publishedCount}/${PUBLISHED_CAP}` };
  }
  const phase: 1 | 2 = publishedCount < 60 ? 1 : 2;
  if (phase !== allowedPhase) {
    return { acted: false, reason: `current-phase-${phase}-skip-slot-${allowedPhase}` };
  }
  // Prefer releasing a queued article; fall back to fresh generation.
  const queued = await pickNextQueuedSlug();
  if (queued) {
    await publishArticle(queued.id, new Date());
    // Mirror the published row to Bunny as articles/<slug>.json (best-effort).
    const fresh = await getArticleBySlug(queued.slug);
    if (fresh) {
      const up = await uploadArticleJson(fresh);
      if (!up.ok) console.warn(`[cron] bunny-json-upload failed for ${queued.slug}: ${up.reason}`);
    }
    return { acted: true, publishedSlug: queued.slug };
  }
  // No queue: generate fresh from the next blueprint we haven't used yet.
  const published = await listPublishedArticles(500);
  const usedSlugs = new Set(published.map((p) => p.slug));
  const nextBlueprint = ARTICLE_BLUEPRINTS.find((b) => !usedSlugs.has(b.slug));
  if (!nextBlueprint) return { acted: false, reason: "no-blueprint-available" };

  const heroUrl = await assignHeroImage(nextBlueprint.slug);
  const out = await generateArticleHtml(
    {
      topic: nextBlueprint.title,
      category: nextBlueprint.category,
      tags: nextBlueprint.tags,
      related: published.slice(0, 8).map((p) => ({ slug: p.slug, title: p.title })),
      authority: nextBlueprint.authority,
    },
    CATALOG,
  );
  const gate = runQualityGate({ body: out.body, wordCount: out.wordCount });
  if (!gate.ok) {
    return { acted: false, reason: `gate-failed:${gate.failures.map((f) => f.rule).join(",")}` };
  }
  const now = new Date();
  await insertArticle({
    slug: nextBlueprint.slug,
    title: nextBlueprint.title,
    metaDescription: nextBlueprint.metaDescription,
    ogTitle: nextBlueprint.title,
    ogDescription: nextBlueprint.metaDescription,
    category: nextBlueprint.category,
    tags: nextBlueprint.tags,
    imageAlt: nextBlueprint.imageAlt,
    readingTime: Math.max(4, Math.round(out.wordCount / 220)),
    author: "The Oracle Lover",
    status: "published",
    publishedAt: now,
    lastModifiedAt: now,
    wordCount: out.wordCount,
    heroUrl,
    asinsUsed: out.asinsUsed,
    internalLinksUsed: out.internalLinksUsed,
    body: out.body,
    tldr: out.tldr,
    opener: nextBlueprint.opener,
    conclusion: nextBlueprint.conclusion,
  });
  // Mirror the freshly-published row to Bunny as articles/<slug>.json.
  const fresh = await getArticleBySlug(nextBlueprint.slug);
  if (fresh) {
    const up = await uploadArticleJson(fresh);
    if (!up.ok) console.warn(`[cron] bunny-json-upload failed for ${nextBlueprint.slug}: ${up.reason}`);
  }
  return { acted: true, publishedSlug: nextBlueprint.slug };
}

export async function runProductSpotlight(): Promise<{
  ran: true;
  rotatedAsin: string | null;
  touchedSlug: string | null;
}> {
  // Real behaviour: pick the highest-rotation eligible product (lowest seen
  // count across published articles) and bump the lastModifiedAt on the
  // newest published article that already references it. This signals fresh
  // editorial activity to crawlers without rewriting body content.
  const published = await listPublishedArticles(60);
  if (published.length === 0) return { ran: true, rotatedAsin: null, touchedSlug: null };

  const asinUseCount = new Map<string, number>();
  for (const p of published) {
    const used: string[] = Array.isArray(p.asinsUsed) ? (p.asinsUsed as string[]) : [];
    for (const a of used) asinUseCount.set(a, (asinUseCount.get(a) || 0) + 1);
  }
  const ranked = CATALOG.slice().sort(
    (a, b) => (asinUseCount.get(a.asin) || 0) - (asinUseCount.get(b.asin) || 0),
  );
  const focus = ranked[0];
  const target = published.find((p) => {
    const u: string[] = Array.isArray(p.asinsUsed) ? (p.asinsUsed as string[]) : [];
    return u.includes(focus.asin);
  }) || published[0];

  await publishArticle(target.id, new Date());
  return { ran: true, rotatedAsin: focus.asin, touchedSlug: target.slug };
}

export async function runRefresh(kind: "monthly" | "quarterly", target: number): Promise<{
  refreshed: number;
  rewritten?: number;
  failed?: number;
}> {
  // Bunny-only mode: actually rewrite the N oldest articles via Claude
  // (claude-sonnet-4-6), pass them through the quality gate, and re-upload
  // them to Bunny. This is what produces *real* freshness signals to
  // search and answer engines, not just a touched timestamp. We cap the
  // number per run to keep the model spend bounded.
  if (!process.env.DATABASE_URL) {
    return await refreshOnBunny(target);
  }
  // DB-backed mode: keep the legacy timestamp-touch behavior. Cron history
  // and Drizzle counts continue to work unchanged.
  const all = await listPublishedArticles(500);
  const oldest = all.slice(-target);
  let refreshed = 0;
  for (const a of oldest) {
    await publishArticle(a.id, new Date());
    refreshed += 1;
  }
  return { refreshed };
}

async function refreshOnBunny(target: number): Promise<{ refreshed: number; rewritten: number; failed: number }> {
  const list = await listPublishedFromBunny();
  // oldest publishedAt first
  const sorted = list.slice().sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return ta - tb;
  });
  const slice = sorted.slice(0, target);
  let rewritten = 0;
  let failed = 0;
  for (const head of slice) {
    try {
      // Always read from origin via the storage zone bypass query string so
      // we never overwrite stale edge-cached body content.
      const a = await getArticleFromBunny(head.slug);
      if (!a || !a.body || a.body.length < 200) {
        failed += 1;
        continue;
      }
      const sys = `You are a senior editor for Perimenopause Panic, a warm, evidence-led, 2026 publication for women in their 30s and 40s. Voice: direct, intelligent, never patronising, never therapy-speak. Never use em dashes or banned LLM words ("diving in", "navigating", "journey", "empowering", "holistic", "unleash", "ultimate guide", "in today's world"). Always write in British-flavoured plain English with American spellings. Preserve every internal link to perimenopausepanic.com and theoraclelover.com, every Amazon search-URL, every <h2>/<h3> structural heading, and every <ol>/<ul> list. Do not add em dashes. Do not include the byline ("By The Oracle Lover") inside the body — the layout renders it. Output: pure HTML body fragment, 1900–2200 words, no <html>/<body> wrapper.`;
      const user = `Title: ${a.title}\nCategory: ${a.category}\nTags: ${(a.tags || []).join(", ")}\nMeta: ${a.metaDescription}\n\nRewrite the body below for a 2026 audience. Tighten weak paragraphs, add fresh examples and data points, surface a clearer TL;DR-friendly opening paragraph, keep the same logical structure and the same internal/outbound links, keep the existing <h2>/<h3> headings or improve them lightly. Target 1900–2200 words. Return only the new HTML body fragment.\n\n=== CURRENT BODY ===\n${a.body}`;
      const newBody = (await callClaude({
        system: sys,
        user,
        maxTokens: 8000,
        temperature: 0.55,
      })).trim();
      const wc = countWords(stripTags(newBody));
      if (wc < 1700) {
        failed += 1;
        continue;
      }
      const gate = runQualityGate({ body: newBody, wordCount: wc });
      if (!gate.ok) {
        failed += 1;
        continue;
      }
      const nowIso = new Date().toISOString();
      const updated = {
        ...a,
        body: newBody,
        wordCount: wc,
        readingTime: Math.max(4, Math.round(wc / 220)),
        lastModifiedAt: nowIso,
      } as any;
      const up = await bunnyPut(
        `articles/${a.slug}.json`,
        Buffer.from(JSON.stringify(updated, null, 2), "utf8"),
        "application/json",
      );
      if (!up.ok) {
        failed += 1;
        continue;
      }
      rewritten += 1;
    } catch (e) {
      console.error(`[refresh] failed for ${head.slug}:`, e);
      failed += 1;
    }
  }
  // Touch the index lastModifiedAt for everything we rewrote, so the sitemap
  // and crawler hints reflect the freshness immediately.
  if (rewritten > 0) {
    try {
      const idxUrl = `${SITE.bunny.pullZone}/articles/index.json?bust=${Date.now()}`;
      const r = await fetch(idxUrl, { headers: { "Cache-Control": "no-cache" } });
      if (r.ok) {
        const idx: any = await r.json();
        const touched = new Set(slice.slice(0, rewritten).map((s) => s.slug));
        const nowIso = new Date().toISOString();
        if (Array.isArray(idx.articles)) {
          idx.articles = idx.articles.map((x: any) =>
            touched.has(x.slug) ? { ...x, lastModifiedAt: nowIso } : x,
          );
          idx.generatedAt = nowIso;
          await bunnyPut(
            "articles/index.json",
            Buffer.from(JSON.stringify(idx, null, 2), "utf8"),
            "application/json",
          );
        }
      }
    } catch (e) {
      console.warn("[refresh] index touch failed:", e);
    }
  }
  return { refreshed: rewritten, rewritten, failed };
}

function stripTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  return (text.match(/\b[A-Za-z0-9'\-]+\b/g) || []).length;
}

export async function runAsinHealth(): Promise<{
  checked: number;
  ok: number;
  failed: string[];
}> {
  // Real ASIN health: issue a polite HEAD against the public Amazon detail
  // page for every ASIN in the catalog. Anything not returning 2xx/3xx is
  // surfaced for manual review. Includes UA + 8s timeout per request.
  const failed: string[] = [];
  let ok = 0;
  for (const p of CATALOG) {
    const url = `https://www.amazon.com/dp/${p.asin}`;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: ctrl.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; PerimenopausePanic-AsinHealth/1.0; +https://perimenopausepanic.com/about)",
          Accept: "text/html,*/*;q=0.5",
        },
      }).finally(() => clearTimeout(t));
      if (res.status >= 200 && res.status < 400) ok += 1;
      else failed.push(`${p.asin}:${res.status}`);
    } catch (e: any) {
      failed.push(`${p.asin}:${e?.name || "err"}`);
    }
  }
  return { checked: CATALOG.length, ok, failed };
}
