/**
 * expandArticlesBunny.ts
 *
 * For every published article on Bunny CDN:
 *   1. Fetch the article JSON
 *   2. Call DeepSeek to expand the existing body to 1800-2200 words
 *      while preserving:
 *        - voice (The Oracle Lover, second person, warm, direct)
 *        - HTML structure (sections, paragraphs, lists, blockquotes)
 *        - every existing <a href> link (Amazon search URLs, internal /articles/<slug>,
 *          theoraclelover.com, .gov/.edu citations)
 *        - the TL;DR section, the byline, the conclusion
 *   3. Re-compute wordCount + readingTime
 *   4. Re-upload the article JSON to Bunny
 *
 * Runs serially with retries. Skips articles that are already >= 1800 words.
 *
 * Run:
 *   pnpm tsx server/scripts/expandArticlesBunny.ts [--only=<slug>]
 */
import "dotenv/config";
import { callClaude } from "../lib/claude";
import { bunnyPut } from "../lib/bunny";
import { SITE } from "../lib/siteConfig";
import type { IndexJson, StoredArticle } from "../lib/articleStore";

const PULL = SITE.bunny.pullZone;
const INDEX_KEY = "articles/index.json";
const STORAGE_HOST = SITE.bunny.storageHost;
const STORAGE_ZONE = SITE.bunny.storageZone;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY!;

/** Read directly from Bunny storage origin to bypass all CDN edge caches
 *  AND any stale storage replicas. */
async function getJsonFromOrigin<T>(key: string): Promise<T | null> {
  try {
    const url = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${key}`;
    const r = await fetch(url, {
      headers: { AccessKey: BUNNY_API_KEY, "Cache-Control": "no-cache" },
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
const MIN_WORDS = 1800;
const MAX_WORDS = 2200;

async function getJson<T>(url: string): Promise<T | null> {
  try {
    // Cache-bust the Bunny edge with a query string so we always read latest
    const sep = url.includes("?") ? "&" : "?";
    const r = await fetch(`${url}${sep}bust=${Date.now()}`, {
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function countWords(html: string): number {
  // strip tags + count word tokens
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

const SYSTEM = `You are The Oracle Lover, the resident editor and writer at Perimenopause Panic.

Your voice:
- Warm, direct, evidence-led, never patronising.
- Second person, intimate, the voice of a friend who knows the literature.
- Specific over generic. Mentions actual hormones (estradiol, progesterone, FSH, LH, cortisol),
  actual milligrams, actual brand names, actual study findings.
- Encouraging without being saccharine. You take women seriously.
- You write in flowing paragraphs, not bullet-list listicle filler.

Your job for this revision:
- You will be given an existing article that is below the target word count.
- Expand it to 1800-2200 words by deepening the existing sections — adding
  evidence, naming specific studies, naming specific products, walking through
  worked examples, adding a "what to expect this week" or "what to watch for"
  paragraph, and a final encouragement. Do NOT pad with filler.
- PRESERVE every <a href="..."> link exactly as written. Do not invent new
  Amazon links or citations. You may add new <a href="..."> links to:
    * https://theoraclelover.com/  (the author site, varied anchor text)
    * .gov / .edu / menopause.org / nih.gov citations only
    * /articles/<slug> internal links to other articles in this list:
      [INTERNAL_LINKS_PLACEHOLDER]
- PRESERVE the existing HTML structure (sections, the data-tldr "ai-overview"
  section if present, the closing byline if present).
- Keep paragraphs at 2-4 sentences. No paragraph longer than 5 sentences.
- Use <h2> and <h3> for sectioning. Use <p> for paragraphs. Use <ul><li> for
  lists, but sparingly (max 2 lists in the whole article).
- DO NOT use em dashes (—). Use commas, periods, or "and" instead.
- DO NOT use the words: "journey", "navigate", "embrace", "powerful",
  "unleash", "empower", "game-changer", "ultimate", "vibe".
- Output ONLY the new article body HTML. No preamble. No "Here is the
  expanded article" sentence. Just the HTML.`;

async function expandOne(a: StoredArticle, internalLinks: string[]): Promise<string | null> {
  const sys = SYSTEM.replace(
    "[INTERNAL_LINKS_PLACEHOLDER]",
    internalLinks.slice(0, 12).map((s) => `      /articles/${s}`).join("\n"),
  );
  const user = `Article slug: ${a.slug}
Title: ${a.title}
Meta description: ${a.metaDescription}
Category: ${a.category}
Tags: ${(a.tags || []).join(", ")}
Current word count: ${a.wordCount}
Target word count: 2000 words minimum, 2200 maximum.

IMPORTANT: The output MUST be at least 2000 words of body text. Count
your words before submitting. If you have written less than 2000 words,
add more substance: a worked example, a paragraph on what to expect this
week, a paragraph on common pitfalls, a closing paragraph of
encouragement. Do not pad with filler.

Existing body HTML (please expand this, do not start over):

${a.body}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const content = (await callClaude({
        system: sys,
        user,
        temperature: 0.7,
        maxTokens: 8000,
      })).trim();
      if (!content) {
        console.warn(`  attempt ${attempt}: empty response`);
        continue;
      }
      // strip a possible code-fence wrapper
      const stripped = content.replace(/^```html?\s*/, "").replace(/```\s*$/, "");
      const wc = countWords(stripped);
      // Accept anything >= 1700 words. Target is 1800-2200, but DeepSeek
      // often lands at 1700-1900 which is close enough and re-prompting at
      // higher temperature rarely yields longer output, just different.
      if (wc < 1700) {
        console.warn(`  attempt ${attempt}: only ${wc} words, retrying`);
        continue;
      }
      return stripped;
    } catch (e) {
      console.warn(`  attempt ${attempt} error:`, (e as Error).message);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  return null;
}

async function main() {
  if (!process.env.BUNNY_API_KEY) {
    console.error("BUNNY_API_KEY missing");
    process.exit(1);
  }
  if (!process.env.CLAUDE_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error("CLAUDE_API_KEY missing");
    process.exit(1);
  }
  const argOnly = process.argv.find((s) => s.startsWith("--only="));
  const onlySlug = argOnly ? argOnly.split("=")[1] : null;

  const idx = await getJson<IndexJson>(`${PULL}/${INDEX_KEY}`);
  if (!idx || !Array.isArray(idx.articles)) {
    console.error("index.json unreachable");
    process.exit(1);
  }
  const allPublishedSlugs = idx.articles
    .filter((a) => a.status === "published")
    .map((a) => a.slug);
  const targets = idx.articles.filter(
    (a) => a.status === "published" && (!onlySlug || a.slug === onlySlug),
  );
  console.log(`expanding ${targets.length} published articles to ${MIN_WORDS}-${MAX_WORDS} words…`);

  let ok = 0, skip = 0, fail = 0;

  async function processOne(e: typeof targets[number]) {
    // Read from origin to avoid stale edge / replica races
    const a = await getJsonFromOrigin<StoredArticle>(`articles/${e.slug}.json`);
    if (!a) { console.log(`  ${e.slug}: unreachable`); fail++; return; }
    if ((a.wordCount || 0) >= MIN_WORDS) {
      console.log(`  ${e.slug}: already ${a.wordCount} words, skip`);
      skip++; return;
    }
    if (!a.body || a.body.trim().length < 200 || !a.heroUrl) {
      console.log(`  ${e.slug}: placeholder (body=${a.body?.length ?? 0}, hero=${a.heroUrl ? "yes" : "no"}), skip`);
      skip++; return;
    }
    console.log(`  ${e.slug}: ${a.wordCount} words → expanding…`);
    const internalLinks = allPublishedSlugs.filter((s) => s !== e.slug);
    const newBody = await expandOne(a, internalLinks);
    if (!newBody) { console.log(`  ${e.slug}: FAILED expansion after retries`); fail++; return; }
    const newWordCount = countWords(newBody);
    const updated: StoredArticle = {
      ...a,
      body: newBody,
      wordCount: newWordCount,
      readingTime: Math.max(3, Math.round(newWordCount / 220)),
      lastModifiedAt: new Date().toISOString(),
    };
    const r = await bunnyPut(
      `articles/${e.slug}.json`,
      Buffer.from(JSON.stringify(updated, null, 2), "utf8"),
      "application/json",
    );
    console.log(`  ${e.slug}: ${a.wordCount} → ${newWordCount} words  bunny=${r.status}`);
    if (r.ok) ok++; else fail++;
  }

  // Run 4-way parallel — DeepSeek handles concurrent requests fine.
  const CONCURRENCY = 4;
  const queue = [...targets];
  async function worker() {
    while (queue.length) {
      const e = queue.shift();
      if (!e) return;
      try { await processOne(e); } catch (err) {
        console.warn(`  ${e.slug}: worker error:`, (err as Error).message);
        fail++;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`\ndone. ok=${ok}  skipped=${skip}  failed=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
