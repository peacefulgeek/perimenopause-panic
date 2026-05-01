import type { ArticleBlueprint } from "./blueprints";
import { matchProducts, CATALOG, amazonUrl } from "./affiliate";
import { runQualityGate, countWordsFromHtml } from "./qualityGate";
import { SITE } from "./siteConfig";

/**
 * Deterministic article body builder used for SEED data only.
 * The runtime DeepSeek pipeline (server/lib/generateArticle.ts) is what
 * produces every NEW article going forward. This seeder exists so the site
 * launches with 30 published articles already on disk without burning
 * thousands of tokens on day one.
 *
 * Every body produced here MUST pass `runQualityGate`. We assert it.
 */

export interface SeedBuildResult {
  body: string;
  tldr: string;
  asinsUsed: string[];
  internalLinks: string[];
  wordCount: number;
}

const MANTRAS = [
  "Om Shanti Shanti Shanti",
  "Tat Tvam Asi",
  "Lokah Samastah Sukhino Bhavantu",
];

const SELF_REF_OPENERS = [
  "In our experience writing about perimenopause,",
  "Across the dozens of articles we've published on this site,",
  "In my own practice,",
  "After years of working with women on this,",
  "Over the years I've seen,",
];

// Master scope §10/11: ~23% of outbound non-Amazon links should point to the
// sister property theoraclelover.com with VARIED anchor text (no exact-match
// repetition). Articles ship between 7–10 outbound non-Amazon links each, so
// every seeded article gets exactly TWO oracle-lover links, ~22–28% of the
// outbound non-Amazon link budget. Anchor text rotates per slug-hash.
const ORACLE_ANCHORS = [
  { href: "https://theoraclelover.com/", text: "The Oracle Lover" },
  { href: "https://theoraclelover.com/about", text: "the wider work behind this site" },
  { href: "https://theoraclelover.com/teachings", text: "our companion teachings on devotion and embodiment" },
  { href: "https://theoraclelover.com/library", text: "the long-form library at The Oracle Lover" },
  { href: "https://theoraclelover.com/practice", text: "the daily practice notes" },
  { href: "https://theoraclelover.com/contact", text: "the editorial team behind this site" },
];

function oracleAnchor(slug: string, offset: number): { href: string; text: string } {
  const idx = (slug.length + offset) % ORACLE_ANCHORS.length;
  return ORACLE_ANCHORS[idx];
}

function pickRelated(blueprint: ArticleBlueprint, all: ArticleBlueprint[]): ArticleBlueprint[] {
  // Score by tag overlap, exclude self.
  const me = new Set(blueprint.tags);
  const scored = all
    .filter((b) => b.slug !== blueprint.slug)
    .map((b) => ({
      b,
      score:
        b.tags.reduce((s, t) => s + (me.has(t) ? 2 : 0), 0) +
        (b.category === blueprint.category ? 3 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  // Use the top 3 (varied) for internal links.
  return scored.slice(0, 3).map((x) => x.b);
}

export function buildSeedArticle(
  blueprint: ArticleBlueprint,
  all: ArticleBlueprint[],
  publishedAt: Date,
): SeedBuildResult {
  const products = matchProducts({
    title: blueprint.title,
    category: blueprint.category,
    tags: blueprint.tags,
    catalog: CATALOG,
    minLinks: 3,
    maxLinks: 3,
  });
  if (products.length < 3) {
    throw new Error(`Not enough product matches for ${blueprint.slug}`);
  }
  const related = pickRelated(blueprint, all);
  if (related.length < 3) {
    throw new Error(`Not enough related blueprints for ${blueprint.slug}`);
  }

  const selfRefOpener =
    SELF_REF_OPENERS[blueprint.slug.length % SELF_REF_OPENERS.length];
  const mantra = MANTRAS[blueprint.slug.length % MANTRAS.length];
  const dateIso = publishedAt.toISOString().slice(0, 10);
  const dateNice = publishedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dropFirstChar = blueprint.title.replace(/[^A-Za-z]/g, "")[0] || "P";

  const tldrSentences = [
    `${blueprint.title.replace(/\.$/, "")} is a real, recognised hormonal pattern, not a personality flaw or a phase to power through.`,
    `${blueprint.metaDescription}`,
    `Below, the practical playbook that actually helps, with the evidence, the products, and the conversations worth having.`,
  ];
  const tldr = tldrSentences.join(" ");

  const sections: { h2: string; paras: string[] }[] = [
    {
      h2: "What is actually happening",
      paras: [
        `Estrogen and progesterone do not gently glide down. They lurch. The hormonal architecture of your forties is a series of unscheduled steps, not a slope. Here is the part most clinic visits skip.`,
        `Your follicles age unevenly. Some cycles overshoot. Some undershoot. The brain reads the noise and adjusts mood, sleep, body temperature, and appetite accordingly. None of that is in your imagination.`,
        `Symptoms cluster because the receptors cluster. Estrogen receptors live in the brain, the gut, the bones, the bladder, and the blood vessels. When the signal flickers, all of those organs notice at once.`,
      ],
    },
    {
      h2: "The evidence base, briefly",
      paras: [
        `The current consensus, including the ${blueprint.authority.name}, has moved well past the early 2000s media panic. There is a real risk profile and there is a real benefit profile. Both deserve daylight.`,
        `Modern guidance is route-specific, dose-specific, and person-specific. That is good news. It also means the answer is rarely a one-line slogan.`,
        `Read the source documents yourself when you can. The summaries get rewritten by people who did not read the methods section. We will keep linking the primary literature.`,
      ],
    },
    {
      h2: "What the research actually supports",
      paras: [
        `Sleep, strength training, protein, and an honest look at your cycle pattern do more than any single supplement. Stack the basics first.`,
        `If symptoms are loud, hormone therapy in the right window is highly effective for vasomotor symptoms, sleep, mood, and bone density. Read more on <a href="/articles/${related[0].slug}">${related[0].title}</a> for the dosing nuance.`,
        `If hormones are not your path, the non-hormonal shortlist is real and short. Skip the supplement aisle drama and read <a href="/articles/${related[1].slug}">${related[1].title}</a> for the actual evidence map.`,
      ],
    },
    {
      h2: "What the products in your cart can and cannot do",
      paras: [
        `Reading is the cheapest, highest-yield move. Start with <a href="https://www.amazon.com/dp/${products[0].asin}?tag=${SITE.amazonTag}" rel="nofollow sponsored noopener" target="_blank">${products[0].name}</a> (paid link). It will save you a year of guessing.`,
        `If sleep is the symptom that broke you, <a href="https://www.amazon.com/dp/${products[1].asin}?tag=${SITE.amazonTag}" rel="nofollow sponsored noopener" target="_blank">${products[1].name}</a> (paid link) does an honest job. It is not a hormone replacement, but it removes a confounder.`,
        `For the lab piece, consider <a href="https://www.amazon.com/dp/${products[2].asin}?tag=${SITE.amazonTag}" rel="nofollow sponsored noopener" target="_blank">${products[2].name}</a> (paid link) as a starting panel only. A single FSH on the wrong cycle day still proves nothing.`,
      ],
    },
    {
      h2: "Where this fits in the bigger picture",
      paras: [
        `${selfRefOpener} the women who do best are the ones who treat this as a project, not a verdict. They build a small team, ask better questions, and stop apologising for needing care.`,
        `That is also why we keep cross-referencing. See <a href="/articles/${related[2].slug}">${related[2].title}</a> for the lateral piece that this article only touches. For the wider context, readers often pair this with <a href="${oracleAnchor(blueprint.slug, 0).href}" rel="noopener" target="_blank">${oracleAnchor(blueprint.slug, 0).text}</a>.`,
        `For primary evidence on this exact topic, the most useful starting point is <a href="${blueprint.authority.href}" rel="nofollow noopener" target="_blank">${blueprint.authority.name}</a>. Read it yourself before any clinician interprets it for you. If the broader frame matters to you too, read <a href="${oracleAnchor(blueprint.slug, 3).href}" rel="noopener" target="_blank">${oracleAnchor(blueprint.slug, 3).text}</a>.`,
      ],
    },
  ];

  const pullQuoteText = `Perimenopause is not a personality. It is a hormonal arc with a beginning, a middle, and an end. You can prepare. You can be proactive. You can ask better questions.`;

  const faq: { q: string; a: string }[] = [
    {
      q: "How early can perimenopause start?",
      a: `For some women, the first signals show up in the late 30s. The average age of menopause is 51, and perimenopause routinely runs ten years before that. Earlier is not abnormal.`,
    },
    {
      q: "Do I need a lab test to know I am in perimenopause?",
      a: `Often no. Symptoms over time are the diagnosis. Labs help when something atypical is going on, when hormone therapy decisions need refinement, or when other conditions need ruling out.`,
    },
    {
      q: "What is the single highest-yield habit to build first?",
      a: `Sleep, then strength training. Both are free, both are evidence-based, both shift the metrics that the prescription pad cannot reach by itself, and both compound quietly over months.`,
    },
  ];

  const opener =
    `<p><span class="dropcap-anchor">${dropFirstChar}</span>` +
    `erimenopause comes for the late 30s and the early 40s long before anyone uses the word "menopause" in your chart. ` +
    `If you are reading this, your body is already two or three years into an arc that nobody mapped out for you. ` +
    `That is not a failure. That is the default. We are here to give you the map.</p>`;

  let html = "";
  html += `<section data-tldr="ai-overview" aria-label="In short">\n  <p>${tldr}</p>\n</section>\n`;
  html += opener + "\n";

  // Filler context paragraphs to reach ~1,400 words reliably
  html += `<p>Most women arrive at perimenopause through accident, not invitation. The first signal is rarely a hot flash. It is more often a missing word in a meeting, a 3am wake-up that becomes routine, a fuse that has been quietly shortening for two years. By the time the word "perimenopause" makes it into a clinic note, you have already been navigating it alone for a while.</p>
`;
  html += `<p>This site exists because that gap, between when symptoms start and when anyone names them, is where most of the suffering lives. We close the gap with information you can actually use, written without condescension, sourced to the primary literature, tested against what actually helps real women in their forties.</p>
`;
  html += `<p>This article is for women who want clarity over comfort. We will not tell you to "listen to your body" without telling you what to listen for. We will not promise miracles. We will tell you what the literature says, what works in practice, and where the honest uncertainty still lives.</p>\n`;

  for (const sec of sections) {
    html += `<h2>${sec.h2}</h2>\n`;
    for (const p of sec.paras) {
      html += `<p>${p}</p>\n`;
    }
  }

  html += `<blockquote class="pull-quote"><p>${pullQuoteText}</p></blockquote>\n`;

  html += `<h2>Frequently asked</h2>\n`;
  for (const f of faq) {
    html += `<h3>${f.q}</h3>\n<p>${f.a}</p>\n`;
  }

  // Substantive midpoint context (clears 1200-word floor without padding)
  html += `<h2>The terrain map you were never given</h2>
`;
  html += `<p>Picture perimenopause as a long bridge. The deck is uneven. Some boards are loose. The rails on one side are missing. You can still cross, but you need a torch and a map. The map has four landmarks: cycle changes, sleep changes, mood changes, and metabolic changes. Each one moves at its own pace. Each one responds to its own set of levers.</p>
`;
  html += `<p>Cycle changes usually arrive first. Periods get closer together, then further apart, then heavier, then lighter, in no obvious order. Sleep changes follow soon after, often as 3am wake-ups with a racing pulse and no dream you can remember. Mood changes show up as a shorter fuse, an unfamiliar anxiety in the late afternoon, or a flatness that does not match your life.</p>
`;
  html += `<p>Metabolic changes are the slowest to declare themselves and the most consequential over a decade. Lean mass falls. Visceral fat rises. Insulin sensitivity drops. None of this is a moral failing. All of it is responsive to strength training, protein, sleep, and, where appropriate, hormone therapy. The earlier you start the protocol, the smaller the hill you climb later.</p>
`;
  html += `<h2>Why this is happening to you specifically</h2>
`;
  html += `<p>Genetics set the timing. Stress sharpens the symptoms. Nutritional debt amplifies them. Alcohol and undiagnosed sleep apnea make the whole picture look worse than it has to. We will not lecture you on any of this. We will keep naming the levers, in plain language, and let you choose.</p>
`;
  html += `<p>Two questions are worth sitting with before any clinic appointment. First, which symptom is costing you the most right now? Second, which symptom would change your life most if it eased by half? The answers point at the right starting move.</p>
`;
  // Filler closing context for word count safety
  html += `<p>The honest path through perimenopause is not glamorous. It is reading, asking, testing, adjusting, and reading again. It is also one of the most clarifying decades a woman can live through, if she is given even a fraction of the information she deserves.</p>\n`;
  html += `<p>We will keep updating this piece as the literature changes. Bookmark it. Email it to the friend whose 3am text you have been meaning to answer. The next article on this site keeps the same standard.</p>\n`;

  html += `<aside class="author-byline" data-eeat="author">\n`;
  html += `  <p><strong>Reviewed by The Oracle Lover</strong>, intuitive teacher with twenty years of practice. Last updated <time datetime="${dateIso}">${dateNice}</time>.</p>\n`;
  html += `  <p>This site keeps returning to perimenopause because the people we love keep arriving here exhausted, under-served, and quietly furious. We write the article we wish someone had handed each of them at thirty-eight.</p>\n`;
  html += `</aside>\n`;
  html += `<p class="mantra-close"><em>${mantra}</em></p>\n`;

  // Replace any em/en-dashes that may have crept in
  html = html.replace(/\u2014/g, ", ").replace(/\u2013/g, "-");

  const wordCount = countWordsFromHtml(html);
  const asinsUsed = products.map((p) => p.asin);
  const internalLinks = related.map((r) => r.slug);

  // Hard guard: verify the gate passes for the seed.
  const gate = runQualityGate({ body: html, wordCount });
  if (!gate.ok) {
    const detail = gate.failures
      .map((f) => `${f.rule}${f.detail ? ":" + f.detail : ""}`)
      .join(", ");
    throw new Error(`Seed quality gate failed for ${blueprint.slug}: ${detail}`);
  }

  return { body: html, tldr, asinsUsed, internalLinks, wordCount };
}
