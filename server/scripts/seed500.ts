import { getDb } from "../db";
import { articles } from "../../drizzle/schema";
import { ARTICLE_BLUEPRINTS as BLUEPRINTS, type ArticleBlueprint } from "../lib/blueprints";
import { sql } from "drizzle-orm";

/**
 * Pre-seed the QUEUED article pipeline so the cron has 500+ topics to draw
 * from. Each generated topic combines the base 30 blueprints with a
 * deterministic audience/angle modifier, producing 500 unique slugs.
 *
 * Status is "queued" — the daily publisher cron picks one at a time and
 * pushes it through the DeepSeek pipeline. Today's site already has 30
 * published; the rest will publish at 1/day, ~16 months of runway.
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  // Build a deterministic 500-strong topic list.
  const generated: ArticleBlueprint[] = [];
  for (const base of BLUEPRINTS) {
    for (const aud of AUDIENCES) {
      for (const angle of ANGLES) {
        if (generated.length >= 500) break;
        const title = `${base.title}: ${angle} ${aud}`;
        const slug = slugify(`${base.slug}-${angle}-${aud.replace(/^for /, "")}`);
        generated.push({
          slug,
          title,
          category: base.category,
          tags: base.tags,
          metaDescription: `${base.metaDescription} Specifically ${aud}, with ${angle}.`,
          imageAlt: base.imageAlt,
          opener: base.opener,
          conclusion: base.conclusion,
          authority: base.authority,
        });
      }
      if (generated.length >= 500) break;
    }
    if (generated.length >= 500) break;
  }
  console.log(`Generated ${generated.length} candidate blueprints`);

  // Drop already-published or already-queued slugs.
  const existing = await db.select({ slug: articles.slug }).from(articles);
  const existingSet = new Set(existing.map((e) => e.slug));
  const fresh = generated.filter((g) => !existingSet.has(g.slug));

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

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
