/**
 * One-shot: re-point every published article's heroUrl + any in-body
 * <img src> from the temporary CloudFront URLs to Bunny library URLs.
 * Deterministic: slug hash → library/lib-{01..20}.webp.
 */
import { getDb } from "../db";
import { articles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { SITE } from "../lib/siteConfig";

function slugToLibIdx(slug: string): number {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 20) + 1;
}

function bunnyHero(slug: string): string {
  const n = String(slugToLibIdx(slug)).padStart(2, "0");
  return `${SITE.bunny.pullZone}/library/lib-${n}.webp`;
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No DB");
    process.exit(1);
  }
  const all = await db.select().from(articles);
  let updated = 0;
  for (const a of all) {
    const newHero = bunnyHero(a.slug);
    let newBody = a.body || "";
    // Replace any <img src="https://d2xsxph8kpxj0f.cloudfront.net/..."> or
    // any other non-bunny absolute hero in the body with the same Bunny URL.
    newBody = newBody.replace(/<img\s+([^>]*?)src="(https?:\/\/[^"]+)"/g, (m, attrs: string, src: string) => {
      if (src.includes("perimenopause.b-cdn.net")) return m;
      return `<img ${attrs}src="${newHero}"`;
    });
    if (a.heroUrl !== newHero || newBody !== a.body) {
      await db.update(articles).set({ heroUrl: newHero, body: newBody }).where(eq(articles.id, a.id));
      updated++;
    }
  }
  console.log(`Repointed ${updated} of ${all.length} articles to Bunny.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
