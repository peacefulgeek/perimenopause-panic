/**
 * One-shot seed: insert 30 published articles backed by the deterministic
 * seedBody builder. Publish dates are spread across the past 60 days, max 1
 * per day, to look like a steady editorial cadence (no mass-publish burst
 * that Google would flag).
 *
 * Run with: pnpm tsx server/scripts/seed.ts
 */
import "dotenv/config";
import { ARTICLE_BLUEPRINTS } from "../lib/blueprints";
import { buildSeedArticle } from "../lib/seedBody";
import {
  insertArticle,
  countByStatus,
  publishedDailyCounts,
} from "../lib/articles";
import { deterministicHeroFor } from "../lib/bunny";

async function main() {
  const before = await countByStatus();
  if ((before.published || 0) >= 30) {
    console.log(
      `[seed] already have ${before.published} published articles, skipping.`,
    );
    return;
  }

  // Spread across past 60 days. Day 0 = today (UTC midnight). We schedule
  // the first article 58 days ago and step ~2 days between each one. None
  // are scheduled on the SAME day, so daily counts are 1, 1, 1, ..., 1.
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 58);

  const all = ARTICLE_BLUEPRINTS;
  let day = new Date(start);

  for (const bp of all) {
    const built = buildSeedArticle(bp, all, day);
    const heroUrl = deterministicHeroFor(bp.slug);

    await insertArticle({
      slug: bp.slug,
      title: bp.title,
      metaDescription: bp.metaDescription,
      ogTitle: bp.title,
      ogDescription: bp.metaDescription,
      category: bp.category,
      tags: bp.tags,
      imageAlt: bp.imageAlt,
      readingTime: Math.max(5, Math.round(built.wordCount / 220)),
      author: "The Oracle Lover",
      status: "published",
      publishedAt: day,
      lastModifiedAt: day,
      wordCount: built.wordCount,
      heroUrl,
      asinsUsed: built.asinsUsed,
      internalLinksUsed: built.internalLinks,
      body: built.body,
      tldr: built.tldr,
      opener: bp.opener,
      conclusion: bp.conclusion,
    });
    console.log(
      `[seed] ${day.toISOString().slice(0, 10)}  ${bp.slug}  (${built.wordCount} words)`,
    );

    day = new Date(day);
    day.setUTCDate(day.getUTCDate() + 2);
  }

  const after = await countByStatus();
  const daily = await publishedDailyCounts();
  console.log("[seed] done.");
  console.log("  published count:", after.published);
  console.log("  unique days:", daily.length);
  console.log("  max per day:", Math.max(...daily.map((d) => Number(d.c) || 0), 0));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed] FAILED:", err);
    process.exit(1);
  });
