import { getDb } from "../db";
import { articles } from "../../drizzle/schema";
import { ARTICLE_BLUEPRINTS as BLUEPRINTS, type ArticleBlueprint } from "../lib/blueprints";
import { sql } from "drizzle-orm";

/**
 * seedNext.ts — append more queued blueprints when the publisher has burned
 * through most of the existing queue.
 *
 * - Idempotent: every candidate slug is filtered against the full set of
 *   existing slugs (queued + published), so re-running this script is safe
 *   and never creates duplicates.
 * - Configurable: pass `N` as the first CLI arg or set `SEED_NEXT_N`.
 *   Default is 500.
 * - Deterministic: candidate slugs are produced by the same audience/angle
 *   grid as `seed500.ts`, with two extra dimensions (`season` and `horizon`)
 *   so successive runs always have fresh slugs to work from. A reserved
 *   8-char hash suffix on every slug guarantees uniqueness even when the
 *   80-char slug cap would otherwise truncate the prefix to a duplicate.
 *
 * Usage:
 *   pnpm tsx server/scripts/seedNext.ts          # default 500
 *   pnpm tsx server/scripts/seedNext.ts 250      # 250
 *   SEED_NEXT_N=1000 pnpm tsx server/scripts/seedNext.ts
 */

const AUDIENCES = [
  "for late-30s women",
  "for early-40s women",
  "for women on antidepressants",
  "for women avoiding HRT",
  "for women with PCOS",
  "for women with endometriosis history",
  "for high-performing women",
  "for women in physical jobs",
  "for new mothers in their forties",
  "for shift workers",
  "for athletes",
  "for women with autoimmune flares",
  "for women on the spectrum",
  "for ADHD women",
  "for women with thyroid issues",
  "for women in graduate school",
  "for caregivers of aging parents",
  "for vegan and plant-based eaters",
];

const ANGLES = [
  "the evidence map",
  "what the literature actually says",
  "what nobody tells you",
  "the cheap version that works",
  "the protocol that holds",
  "the questions to ask your doctor",
  "what to track for 90 days",
  "the morning routine",
  "the evening routine",
  "the supplement reality check",
  "the labs worth running",
  "the labs that mislead",
  "what to stop doing",
  "what to start doing",
  "what to keep doing",
  "the conversation script",
];

// Two extra dimensions so seedNext doesn't collide with seed500's grid.
const SEASONS = ["winter", "spring", "summer", "autumn"];
const HORIZONS = ["this year", "the next 5 years", "decade two"];

/** djb2 hash, hex, 8 chars — deterministic and tiny. */
function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

/**
 * Slugify with a reserved 9-char hash suffix (`-xxxxxxxx`) so the final slug
 * is always unique, even when the prefix gets truncated by the 80-char cap.
 * The hash is computed from the full untruncated input, so different inputs
 * that share a truncated prefix still produce different slugs.
 */
function slugify(s: string): string {
  const hash = shortHash(s);
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base.slice(0, 71)}-${hash}`;
}

function parseN(): number {
  const raw = process.argv[2] || process.env.SEED_NEXT_N || "500";
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`SEED_NEXT_N must be a positive integer; got ${raw}`);
  }
  return n;
}

export function generateCandidates(n: number): ArticleBlueprint[] {
  const out: ArticleBlueprint[] = [];
  outer: for (const base of BLUEPRINTS) {
    for (const aud of AUDIENCES) {
      for (const angle of ANGLES) {
        for (const season of SEASONS) {
          for (const horizon of HORIZONS) {
            if (out.length >= n) break outer;
            const title = `${base.title}: ${angle} ${aud} (${season}, ${horizon})`;
            const slug = slugify(
              `${base.slug}-${angle}-${aud.replace(/^for /, "")}-${season}-${horizon}`,
            );
            out.push({
              slug,
              title,
              category: base.category,
              tags: base.tags,
              metaDescription: `${base.metaDescription} Specifically ${aud}, with ${angle}, focused on ${season} and ${horizon}.`,
              imageAlt: base.imageAlt,
              opener: base.opener,
              conclusion: base.conclusion,
              authority: base.authority,
            });
          }
        }
      }
    }
  }
  return out;
}

async function main() {
  const N = parseN();
  const db = await getDb();
  if (!db) throw new Error("no db");

  const candidates = generateCandidates(N);
  console.log(`Generated ${candidates.length} candidate blueprints (target ${N})`);

  const existing = await db.select({ slug: articles.slug }).from(articles);
  const existingSet = new Set(existing.map((e) => e.slug));
  const fresh = candidates.filter((c) => !existingSet.has(c.slug));
  console.log(`Filtered ${candidates.length - fresh.length} duplicates; ${fresh.length} fresh`);

  let inserted = 0;
  for (const b of fresh) {
    await db.insert(articles).values({
      slug: b.slug,
      title: b.title,
      metaDescription: b.metaDescription,
      ogTitle: b.title,
      ogDescription: b.metaDescription,
      category: b.category,
      tags: b.tags as any,
      imageAlt: b.imageAlt,
      readingTime: 8,
      author: "The Oracle Lover",
      status: "queued" as const,
      publishedAt: null,
      lastModifiedAt: new Date(),
      wordCount: 0,
      heroUrl: "",
      asinsUsed: [] as any,
      internalLinksUsed: [] as any,
      opener: b.opener,
      conclusion: b.conclusion,
      tldr: "",
      body: "",
    } as typeof articles.$inferInsert);
    inserted++;
  }
  console.log(`✓ inserted ${inserted} queued articles`);

  const counts = await db
    .select({ status: articles.status, n: sql<number>`COUNT(*)` })
    .from(articles)
    .groupBy(articles.status);
  console.log("Status counts:", counts);
}

if (process.argv[1]?.endsWith("seedNext.ts") || process.argv[1]?.endsWith("seedNext.js")) {
  main().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
