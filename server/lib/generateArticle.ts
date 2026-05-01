import { callDeepSeek } from "./deepseek";
import { runQualityGate, countWordsFromHtml, AI_FLAGGED_WORDS, AI_FLAGGED_PHRASES } from "./qualityGate";
import { matchProducts, type Product } from "./affiliate";
import { SITE } from "./siteConfig";

export interface GenerateInput {
  topic: string;
  category: string;
  tags: string[];
  related: { slug: string; title: string }[];
  authority: {
    name: string;
    href: string;
  };
}

export interface GenerateOutput {
  body: string;
  tldr: string;
  asinsUsed: string[];
  internalLinksUsed: string[];
  wordCount: number;
}

const ORACLE_PHRASES = [
  "Look, here's the thing.",
  "Stop overthinking this.",
  "This isn't mystical. It's mechanical.",
  "Let me demystify this for you.",
  "Here's what actually works.",
  "Nobody's coming to explain this to you, so I will.",
  "The body doesn't lie. The mind does.",
  "Less theory, more practice.",
];

const SELF_REF_OPENERS = [
  "In our experience writing about perimenopause,",
  "Across the dozens of articles we've published on this site,",
  "Over the years I've seen,",
  "After years of working with women on this,",
  "In my own practice,",
];

function hardRulesPrompt(opts: {
  products: Product[];
  related: { slug: string; title: string }[];
  authority: { name: string; href: string };
  selfRefOpener: string;
  oraclePhrases: string[];
}): string {
  const productLines = opts.products
    .map(
      (p) =>
        `- ${p.name} (ASIN ${p.asin}) — ${p.category}: https://www.amazon.com/dp/${p.asin}?tag=${SITE.amazonTag}`,
    )
    .join("\n");
  const relatedLines = opts.related
    .map((r) => `- ${r.title} -> /articles/${r.slug}`)
    .join("\n");
  return `HARD RULES (the article is regenerated if any rule is broken):

VOICE: The Oracle Lover. Short punchy sentences (8-14 words). Practical, direct,
warm but not patronising. Use 3-5 of these phrases verbatim across the body:
${opts.oraclePhrases.map((p) => `  - "${p}"`).join("\n")}

NEVER use these words anywhere (case-insensitive, whole-word):
  ${AI_FLAGGED_WORDS.join(", ")}

NEVER use these phrases (case-insensitive substring):
  ${AI_FLAGGED_PHRASES.join(" | ")}

PUNCTUATION: Zero em-dashes (U+2014). Zero en-dashes (U+2013). Use commas,
periods, colons, parentheses, or hyphen-with-spaces.

STRUCTURE (top to bottom, exactly):
1. <section data-tldr="ai-overview" aria-label="In short"> with one <p> of
   THREE short declarative sentences (each ≤32 words) that answer the title
   directly. No questions. No "this article will..."
2. Opening paragraph (no heading) — first sentence with a class="dropcap-anchor"
   span around the first letter, e.g. <span class="dropcap-anchor">P</span>.
3. THREE to FIVE <h2> sections with H3 subsections where helpful.
4. At least ONE <blockquote class="pull-quote"> styled pull quote.
5. THREE Amazon affiliate <a> tags with rel="nofollow sponsored noopener"
   target="_blank", each followed in plain text by "(paid link)". Use ONLY
   the products in the AVAILABLE PRODUCTS list. Format URL exactly:
   https://www.amazon.com/dp/[ASIN]?tag=${SITE.amazonTag}
6. THREE internal links to other articles on this site, woven into prose
   with varied anchor text. Use the slugs in INTERNAL LINK CANDIDATES below.
   Anchor format: <a href="/articles/<slug>">descriptive anchor text</a>.
7. ONE external authoritative link (.gov / .edu / NIH / NAMS / Nature / PubMed
   / NEJM / JAMA / BMJ / The Lancet) with rel="nofollow noopener"
   target="_blank". Use the AUTHORITY SOURCE provided.
8. ONE self-referencing sentence beginning with: "${opts.selfRefOpener}"
9. A short FAQ section (2-3 question H3s with answers) — optional but
   encouraged.
10. Author byline at the bottom EXACTLY this shape:
    <aside class="author-byline" data-eeat="author">
      <p><strong>Reviewed by The Oracle Lover</strong>, intuitive teacher with
      twenty years of practice. Last updated <time datetime="YYYY-MM-DD">
      Month Day, YYYY</time>.</p>
      <p>One or two warm sentences of self-referencing context about why this
      site keeps returning to this topic.</p>
    </aside>
11. End with a single italicised Sanskrit mantra line (one of:
    "Om Shanti Shanti Shanti", "Tat Tvam Asi",
    "Lokah Samastah Sukhino Bhavantu") inside <p class="mantra-close"><em>...</em></p>.

OUTPUT: Pure HTML body content. No <html>, <head>, or <body>. No Markdown.
No backticks. The output is stored verbatim in the database.

AVAILABLE PRODUCTS (use exactly THREE):
${productLines}

INTERNAL LINK CANDIDATES (use exactly THREE):
${relatedLines}

AUTHORITY SOURCE: ${opts.authority.name} -> ${opts.authority.href}

WORD COUNT: 1,400-2,200 words of visible body text. The gate fails outside
1,200-2,500.`;
}

function systemPrompt(): string {
  return `You are The Oracle Lover writing for Perimenopause Panic, an editorial
site about early perimenopause and the hormonal decade nobody warned women
about. Your voice is warm, witty, sharp, evidence-based, and never
patronising. You demystify medical research without dumbing it down. You
write in short punchy sentences and you NEVER use em-dashes or any of the
banned AI-tell words. Stay grounded; stay practical.`;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

export async function generateArticleHtml(
  input: GenerateInput,
  catalog: Product[],
): Promise<GenerateOutput> {
  const products = matchProducts({
    title: input.topic,
    category: input.category,
    tags: input.tags,
    catalog,
    minLinks: 3,
    maxLinks: 3,
  });
  const related = input.related.slice(0, 5);
  const selfRefOpener = SELF_REF_OPENERS[Math.floor(Math.random() * SELF_REF_OPENERS.length)];
  const oraclePhrases = pickRandom(ORACLE_PHRASES, 4);

  const sys = systemPrompt();
  const hardRules = hardRulesPrompt({
    products,
    related,
    authority: input.authority,
    selfRefOpener,
    oraclePhrases,
  });
  const user = `${hardRules}

TOPIC: ${input.topic}
CATEGORY: ${input.category}
TAGS: ${input.tags.join(", ")}

Write the article now.`;

  let body = await callDeepSeek({ system: sys, user });
  body = sanitizeArticleHtml(body);

  let wordCount = countWordsFromHtml(body);
  let attempt = 0;
  let gate = runQualityGate({ body, wordCount });

  while (!gate.ok && attempt < 2) {
    attempt += 1;
    const fix = `Your previous draft failed the quality gate with these failures:
${gate.failures.map((f) => `- ${f.rule}${f.detail ? ` (${f.detail})` : ""}`).join("\n")}

Rewrite the article from scratch obeying every HARD RULE above.`;
    body = await callDeepSeek({ system: sys, user: `${user}\n\n${fix}` });
    body = sanitizeArticleHtml(body);
    wordCount = countWordsFromHtml(body);
    gate = runQualityGate({ body, wordCount });
  }

  const tldrMatch = body.match(/<section[^>]*data-tldr=["']ai-overview["'][^>]*>([\s\S]*?)<\/section>/i);
  const tldr = tldrMatch ? tldrMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";

  const asinsUsed = Array.from(
    new Set(
      Array.from(body.matchAll(/amazon\.com\/dp\/([A-Z0-9]+)/g)).map((m) => m[1]),
    ),
  );
  const internalLinksUsed = Array.from(
    new Set(
      Array.from(body.matchAll(/\/articles\/([a-z0-9-]+)/g)).map((m) => m[1]),
    ),
  );

  return { body, tldr, asinsUsed, internalLinksUsed, wordCount };
}

export function sanitizeArticleHtml(html: string): string {
  // Strip code fences, leading/trailing markdown noise, and any em/en dashes
  // that slipped past the prompt.
  return html
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/\u2014/g, ", ")
    .replace(/\u2013/g, "-")
    .trim();
}
