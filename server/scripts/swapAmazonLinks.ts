import { getDb } from "../db";
import { articles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Replace every <a href="https://www.amazon.com/dp/{ASIN}/?tag=...">{TEXT}</a>
 * inside published article bodies with an Amazon SEARCH link using the link
 * text as the query. Search links always resolve to a real, current results
 * page with the affiliate tag attached.
 */
async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  const all = await db.select().from(articles);
  const TAG = "spankyspinola-20";
  let totalSwaps = 0;

  for (const a of all) {
    if (!a.body) continue;
    const original = a.body;
    const swapped = original.replace(
      /<a\s+href="https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]+\/?\?tag=[\w-]+"([^>]*)>([^<]+)<\/a>/g,
      (_m, attrs: string, text: string) => {
        totalSwaps++;
        const q = encodeURIComponent(text.trim());
        return `<a href="https://www.amazon.com/s?k=${q}&tag=${TAG}"${attrs}>${text}</a>`;
      }
    );
    if (swapped !== original) {
      await db.update(articles).set({ body: swapped }).where(eq(articles.id, a.id));
    }
  }
  console.log(`✓ rewrote ${totalSwaps} amazon /dp/ links → /s? search links across ${all.length} articles`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
