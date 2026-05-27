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
    await recordCronRun({ job, status: "ok", message: null, payload: (out as any) ?? null });
  } catch (e: any) {
    console.error(`[cron] ${job} failed:`, e);
    await recordCronRun({
      job,
      status: "error",
      message: String(e?.message || e),
      payload: null,
    });
  }
}

export async function runPublisher(allowedPhase: 1 | 2): Promise<{
  acted: boolean;
  reason?: string;
  publishedSlug?: string;
}> {
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
}> {
  // Touch lastModifiedAt on the N oldest published articles so dateModified
  // updates surface in the sitemap and JSON-LD.
  const all = await listPublishedArticles(500);
  const oldest = all.slice(-target);
  let refreshed = 0;
  for (const a of oldest) {
    await publishArticle(a.id, new Date());
    refreshed += 1;
  }
  return { refreshed };
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
