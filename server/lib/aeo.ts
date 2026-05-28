/**
 * aeo.ts — Answer Engine + LLM discoverability helpers.
 *
 * Generates the server-rendered head metadata, JSON-LD blocks, robots.txt,
 * sitemap.xml, /llms.txt, and /llms-full.txt for Perimenopause Panic.
 *
 * Round 11 final pass:
 *  - robots.txt explicitly Allow's the full AI crawler matrix from the
 *    BacklinkWebsites spec (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot,
 *    Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User,
 *    Google-Extended, Bingbot, CCBot, Applebot, Applebot-Extended,
 *    DuckAssistBot, Meta-ExternalAgent, YouBot, MistralAI-User, Cohere-AI).
 *  - sitemap.xml uses ISO-8601 lastmod and ranks newest articles first.
 *  - /llms.txt is grouped by category, /llms-full.txt is frontmatter-delimited.
 *  - articleJsonLd: Article + BreadcrumbList (Home, Articles, Category,
 *    Article), FAQPage extracted from question H2/H3/H4 (cap 6, only if real),
 *    optional HowTo from ordered <ol> step lists, plus Speakable (TL;DR).
 *  - Article includes inLanguage, isAccessibleForFree, articleSection,
 *    wordCount, image, mainEntityOfPage, reviewedBy.
 *  - homeJsonLd: Organization + WebSite + Person (the author).
 *  - aboutPageJsonLd / collectionPageJsonLd / speakable helpers.
 *  - canonicalLinkFor strips utm_*, fbclid, gclid, mc_eid noise.
 */
import type { Article } from "../../drizzle/schema";
import { SITE, publicBaseUrl } from "./siteConfig";
import { listPublishedFromBunny } from "./articleStore";

/* ------------------------------------------------------------------ */
/* robots.txt                                                          */
/* ------------------------------------------------------------------ */

const AI_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "Slurp",
  // Search engines that opt-in/out flags
  "Google-Extended",
  "Applebot-Extended",
  // OpenAI
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  // Anthropic
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Common Crawl
  "CCBot",
  // DuckDuckGo Assist
  "DuckAssistBot",
  // Meta / FB
  "Meta-ExternalAgent",
  // You.com
  "YouBot",
  // Mistral
  "MistralAI-User",
  // Cohere
  "Cohere-AI",
];

export function buildRobotsTxt(): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const lines: string[] = [];
  lines.push("# Perimenopause Panic — open to indexing and AI training.");
  lines.push("# This site welcomes search and answer-engine crawlers.");
  lines.push("");
  lines.push("User-agent: *");
  lines.push("Allow: /");
  lines.push("Disallow: /api/");
  lines.push("");
  for (const ua of AI_CRAWLERS) {
    lines.push(`User-agent: ${ua}`);
    lines.push("Allow: /");
    lines.push("");
  }
  lines.push(`Sitemap: ${apex}/sitemap.xml`);
  lines.push(`Sitemap: ${apex}/llms.txt`);
  lines.push(`Sitemap: ${apex}/llms-full.txt`);
  lines.push("");
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* sitemap.xml                                                         */
/* ------------------------------------------------------------------ */

export async function buildSitemapXml(): Promise<string> {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const articles = await listPublishedFromBunny();
  // newest first
  const sorted = articles.slice().sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
  const nowIso = new Date().toISOString();
  const staticPages = [
    { loc: `${apex}/`, priority: 1.0, changefreq: "daily", lastmod: nowIso },
    { loc: `${apex}/articles`, priority: 0.9, changefreq: "daily", lastmod: nowIso },
    { loc: `${apex}/about`, priority: 0.6, changefreq: "monthly", lastmod: nowIso },
    { loc: `${apex}/tools-we-recommend`, priority: 0.7, changefreq: "weekly", lastmod: nowIso },
    { loc: `${apex}/herbs`, priority: 0.6, changefreq: "monthly", lastmod: nowIso },
    { loc: `${apex}/assessments`, priority: 0.6, changefreq: "monthly", lastmod: nowIso },
    { loc: `${apex}/contact`, priority: 0.4, changefreq: "yearly", lastmod: nowIso },
    { loc: `${apex}/disclosures`, priority: 0.4, changefreq: "yearly", lastmod: nowIso },
    { loc: `${apex}/privacy`, priority: 0.4, changefreq: "yearly", lastmod: nowIso },
  ];
  const urls = [
    ...staticPages.map(
      (p) =>
        `  <url><loc>${p.loc}</loc><lastmod>${p.lastmod}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`,
    ),
    ...sorted.map((a) => {
      const last = a.lastModifiedAt
        ? new Date(a.lastModifiedAt).toISOString()
        : a.publishedAt
        ? new Date(a.publishedAt).toISOString()
        : nowIso;
      return `  <url><loc>${apex}/articles/${a.slug}</loc><lastmod>${last}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }),
  ].join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/* ------------------------------------------------------------------ */
/* llms.txt and llms-full.txt                                          */
/* ------------------------------------------------------------------ */

export async function buildLlmsTxt(): Promise<string> {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const articles = await listPublishedFromBunny();
  const lines: string[] = [];
  lines.push(`# ${SITE.name}`);
  lines.push("");
  lines.push(`> ${SITE.tagline}`);
  lines.push("");
  lines.push(`Author: ${SITE.authorName} (${SITE.authorSite})`);
  lines.push(`Apex: ${apex}`);
  lines.push(`Sitemap: ${apex}/sitemap.xml`);
  lines.push(`Full corpus: ${apex}/llms-full.txt`);
  lines.push("");
  lines.push("## Site map");
  lines.push(`- [Home](${apex}/) — editorial home page, recent articles`);
  lines.push(`- [Articles](${apex}/articles) — full archive, searchable`);
  lines.push(`- [Tools We Recommend](${apex}/tools-we-recommend) — books and supplements`);
  lines.push(`- [Herbs library](${apex}/herbs) — herbs, TCM, and supplements with evidence summary`);
  lines.push(`- [Self-assessments](${apex}/assessments) — symptom self-assessments`);
  lines.push(`- [About](${apex}/about) — author and editorial principles`);
  lines.push(`- [Disclosures](${apex}/disclosures) — affiliate and editorial policy`);
  lines.push(`- [Privacy](${apex}/privacy) — privacy policy`);
  lines.push(`- [Contact](${apex}/contact) — email and newsletter signup`);
  lines.push("");

  // Group by category for crawler readability.
  const byCat = new Map<string, typeof articles>();
  for (const a of articles) {
    const cat = a.category || "perimenopause";
    if (!byCat.has(cat)) byCat.set(cat, [] as any);
    (byCat.get(cat) as any).push(a);
  }
  // Stable category order: alphabetical for predictability.
  const cats = Array.from(byCat.keys()).sort();
  for (const cat of cats) {
    lines.push(`## ${humanCat(cat)}`);
    const list = (byCat.get(cat) as any).sort((x: any, y: any) => {
      const tx = x.publishedAt ? Date.parse(x.publishedAt) : 0;
      const ty = y.publishedAt ? Date.parse(y.publishedAt) : 0;
      return ty - tx;
    });
    for (const a of list) {
      lines.push(`- [${a.title}](${apex}/articles/${a.slug}) — ${a.metaDescription}`);
    }
    lines.push("");
  }
  return lines.join("\n") + "\n";
}

function humanCat(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export async function buildLlmsFullTxt(): Promise<string> {
  // Frontmatter-delimited, Bunny-only. Uses the public StoredArticle shape so
  // we never read from the database in production.
  const apex = publicBaseUrl().replace(/\/$/, "");
  const { listPublishedFromBunny: list, getArticleFromBunny } = await import(
    "./articleStore"
  );
  const heads = await list();
  const out: string[] = [
    `# ${SITE.name} — full corpus`,
    `# ${SITE.tagline}`,
    `# Apex: ${apex}`,
    `# Author: ${SITE.authorName} (${SITE.authorSite})`,
    "",
  ];
  for (const h of heads) {
    const a = await getArticleFromBunny(h.slug);
    if (!a) continue;
    out.push("---");
    out.push(`title: ${a.title}`);
    out.push(`slug: ${a.slug}`);
    out.push(`url: ${apex}/articles/${a.slug}`);
    out.push(`category: ${a.category}`);
    out.push(`tags: ${(a.tags || []).join(", ")}`);
    out.push(`author: ${SITE.authorName}`);
    out.push(`publishedAt: ${a.publishedAt || ""}`);
    out.push(`lastModifiedAt: ${a.lastModifiedAt || ""}`);
    out.push(`wordCount: ${a.wordCount}`);
    out.push("---");
    out.push("");
    if (a.tldr) {
      out.push(`> ${a.tldr}`);
      out.push("");
    }
    out.push(stripHtml(a.body));
    out.push("");
  }
  return out.join("\n");
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* JSON-LD: shared types + helpers                                     */
/* ------------------------------------------------------------------ */

export type ArticleLike = {
  slug: string;
  title: string;
  metaDescription: string;
  heroUrl: string;
  publishedAt?: Date | string | null;
  lastModifiedAt?: Date | string | null;
  tags?: string[];
  category: string;
  wordCount: number;
  body?: string;
  tldr?: string;
  author?: string | { name: string; site?: string; title?: string };
};

function authorPersonNode(a: ArticleLike) {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const name =
    typeof a.author === "string"
      ? a.author
      : a.author?.name ?? SITE.authorName;
  const site =
    typeof a.author === "string"
      ? SITE.authorSite
      : a.author?.site ?? SITE.authorSite;
  const title =
    typeof a.author === "string"
      ? SITE.authorTitle
      : a.author?.title ?? SITE.authorTitle;
  return {
    "@type": "Person",
    "@id": `${apex}/about#author`,
    name,
    url: site,
    jobTitle: title,
    description:
      "Intuitive teacher, evidence-led editor, twenty years of practice. Editor of Perimenopause Panic.",
    sameAs: [site],
    knowsAbout: [
      "perimenopause",
      "menopause transition",
      "hormone replacement therapy",
      "estradiol",
      "progesterone",
      "FSH testing",
      "perimenopause sleep",
      "perimenopause anxiety",
      "perimenopause weight",
      "non-hormonal options for perimenopause",
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Article + Breadcrumb + FAQ + HowTo                                  */
/* ------------------------------------------------------------------ */

export function articleJsonLd(a: ArticleLike): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const url = `${apex}/articles/${a.slug}`;
  const datePublished = a.publishedAt
    ? new Date(a.publishedAt).toISOString()
    : new Date().toISOString();
  const dateModified = a.lastModifiedAt
    ? new Date(a.lastModifiedAt).toISOString()
    : datePublished;

  const article: any = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: a.title,
    name: a.title,
    description: a.metaDescription,
    image: [a.heroUrl],
    inLanguage: "en-US",
    isAccessibleForFree: true,
    datePublished,
    dateModified,
    author: authorPersonNode(a),
    reviewedBy: authorPersonNode(a),
    publisher: {
      "@type": "Organization",
      "@id": `${apex}#org`,
      name: SITE.name,
      url: apex,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.bunny.pullZone}/library/lib-01.webp`,
      },
    },
    keywords: (a.tags || []).join(", "),
    articleSection: humanCat(a.category),
    wordCount: a.wordCount,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ['[data-tldr="ai-overview"]'],
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${apex}/` },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${apex}/articles` },
      {
        "@type": "ListItem",
        position: 3,
        name: humanCat(a.category),
        item: `${apex}/articles?category=${encodeURIComponent(a.category)}`,
      },
      { "@type": "ListItem", position: 4, name: a.title, item: url },
    ],
  };

  const blocks: string[] = [
    `<script type="application/ld+json">${JSON.stringify(article)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
  ];

  // FAQPage from question-style headings inside the body.
  const body = a.body || "";
  if (body) {
    const faq = extractFaqFromBody(body);
    if (faq.length >= 2) {
      const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.slice(0, 6).map((qa) => ({
          "@type": "Question",
          name: qa.q,
          acceptedAnswer: { "@type": "Answer", text: qa.a },
        })),
      };
      blocks.push(`<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`);
    }

    const howto = extractHowToFromBody(body, a.title);
    if (howto && !faq.length) {
      // mutually exclusive with FAQ to avoid Google penalising mixed signals
      blocks.push(`<script type="application/ld+json">${JSON.stringify(howto)}</script>`);
    }
  }

  return blocks.join("\n");
}

/**
 * Pull FAQ pairs out of the article body. A heading is a question if it ends
 * with `?` or starts with the typical wh-words. The answer is the next sibling
 * paragraph(s), stripped to plain text, capped at ~600 chars.
 */
export function extractFaqFromBody(html: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  const re = /<h([234])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[234][^>]*>|<\/section>|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const heading = stripHtml(m[2]).trim();
    if (!heading) continue;
    const isQ = /\?$/.test(heading) || /^(what|why|how|when|where|who|do|does|is|are|can|should)\b/i.test(heading);
    if (!isQ) continue;
    const ans = stripHtml(m[3]).trim();
    if (!ans || ans.length < 40) continue;
    out.push({ q: heading.replace(/\s+\?$/, "?"), a: ans.slice(0, 600) });
  }
  return out;
}

/**
 * Detect a HowTo: the body has an <ol> with at least 3 <li> items where each
 * item starts with an action verb. We avoid emitting HowTo for medical
 * decision content; the topic must look procedural.
 */
export function extractHowToFromBody(html: string, title: string): any | null {
  const olMatch = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
  if (!olMatch) return null;
  const liMatches = Array.from(olMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi));
  if (liMatches.length < 3) return null;
  const steps = liMatches.map((m) => stripHtml(m[1]).trim()).filter(Boolean);
  if (steps.length < 3) return null;
  // crude verb-first heuristic
  const verbStarts = steps.filter((s) =>
    /^(start|stop|track|test|measure|read|take|swap|drop|cut|add|move|breathe|stretch|sleep|eat|drink|book|ask|call|write|note|use|set|build|do|try|repeat|rest)\b/i.test(s),
  );
  if (verbStarts.length < 3) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    step: steps.slice(0, 12).map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: text.split(".")[0].slice(0, 80),
      text,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Sitewide / page-specific JSON-LD                                    */
/* ------------------------------------------------------------------ */

export function homeOrgJsonLd(): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${apex}#org`,
    name: SITE.name,
    url: apex,
    logo: {
      "@type": "ImageObject",
      url: `${SITE.bunny.pullZone}/library/lib-01.webp`,
    },
    sameAs: [SITE.authorSite],
    knowsAbout: [
      "perimenopause",
      "menopause transition",
      "hormone replacement therapy",
      "estrogen and the female brain",
      "perimenopause sleep",
      "perimenopause anxiety",
      "perimenopause and exercise",
    ],
    publisher: {
      "@type": "Person",
      name: SITE.authorName,
      url: SITE.authorSite,
    },
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${apex}#website`,
    name: SITE.name,
    url: apex,
    inLanguage: "en-US",
    publisher: { "@id": `${apex}#org` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${apex}/articles?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${apex}/about#author`,
    name: SITE.authorName,
    url: SITE.authorSite,
    jobTitle: SITE.authorTitle,
    description:
      "Intuitive teacher, evidence-led editor, twenty years of practice. Editor of Perimenopause Panic.",
    sameAs: [SITE.authorSite],
  };
  return [
    `<script type="application/ld+json">${JSON.stringify(org)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(website)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(person)}</script>`,
  ].join("\n");
}

export function aboutPageJsonLd(): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const node = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${apex}/about`,
    url: `${apex}/about`,
    name: `About ${SITE.name}`,
    description: SITE.tagline,
    inLanguage: "en-US",
    isPartOf: { "@id": `${apex}#website` },
    publisher: { "@id": `${apex}#org` },
    mainEntity: {
      "@type": "Person",
      "@id": `${apex}/about#author`,
      name: SITE.authorName,
      url: SITE.authorSite,
      jobTitle: SITE.authorTitle,
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(node)}</script>`;
}

export async function collectionPageJsonLd(): Promise<string> {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const articles = await listPublishedFromBunny();
  const items = articles.slice(0, 30).map((a, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${apex}/articles/${a.slug}`,
    name: a.title,
  }));
  const node = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${apex}/articles`,
    url: `${apex}/articles`,
    name: `All articles — ${SITE.name}`,
    description: "Every article published on Perimenopause Panic, newest first.",
    inLanguage: "en-US",
    isPartOf: { "@id": `${apex}#website` },
    publisher: { "@id": `${apex}#org` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: articles.length,
      itemListElement: items,
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(node)}</script>`;
}

/* ------------------------------------------------------------------ */
/* small DOM helpers                                                   */
/* ------------------------------------------------------------------ */

export function injectHead(template: string, parts: string): string {
  if (template.includes("</head>")) {
    return template.replace("</head>", `${parts}\n</head>`);
  }
  return template;
}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "mc_eid",
  "mc_cid",
  "_ga",
  "ref",
]);

/**
 * Build a clean canonical URL for the given path. Strips known tracking
 * parameters; keeps semantically meaningful ones (q, page, category).
 */
export function canonicalLinkFor(path: string): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const [pathOnly, qs] = path.split("?");
  let clean = pathOnly || "/";
  // collapse trailing slash except root
  if (clean.length > 1 && clean.endsWith("/")) clean = clean.replace(/\/+$/, "");
  if (qs) {
    const params = new URLSearchParams(qs);
    for (const k of Array.from(params.keys())) {
      if (TRACKING_PARAMS.has(k.toLowerCase())) params.delete(k);
    }
    const cleaned = params.toString();
    if (cleaned) clean = `${clean}?${cleaned}`;
  }
  return `<link rel="canonical" href="${apex}${clean}" />`;
}

export function tldrPreShell(tldr: string): string {
  const text = (tldr || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return `<section data-tldr="ai-overview" aria-label="In short" style="display:none">${escapeHtml(
    text,
  )}</section>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------------ */
/* Article meta-tag builder (article:* OG tags)                        */
/* ------------------------------------------------------------------ */

export function articleHeadMeta(a: ArticleLike): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const datePublished = a.publishedAt
    ? new Date(a.publishedAt).toISOString()
    : new Date().toISOString();
  const dateModified = a.lastModifiedAt
    ? new Date(a.lastModifiedAt).toISOString()
    : datePublished;
  const ogImg = a.heroUrl || `${SITE.bunny.pullZone}/library/lib-01.webp`;
  const url = `${apex}/articles/${a.slug}`;
  const ogTitle = (a as any).ogTitle || a.title;
  const ogDescription = (a as any).ogDescription || a.metaDescription;
  return [
    `<title>${escapeHtml(a.title)} — ${SITE.name}</title>`,
    `<meta name="description" content="${escapeHtml(a.metaDescription)}" />`,
    canonicalLinkFor(`/articles/${a.slug}`),
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`,
    `<meta property="og:image" content="${ogImg}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
    `<meta property="article:published_time" content="${datePublished}" />`,
    `<meta property="article:modified_time" content="${dateModified}" />`,
    `<meta property="article:author" content="${SITE.authorName}" />`,
    `<meta property="article:section" content="${escapeHtml(humanCat(a.category))}" />`,
    ...(a.tags || []).map((t) => `<meta property="article:tag" content="${escapeHtml(t)}" />`),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`,
    `<meta name="twitter:image" content="${ogImg}" />`,
    `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />`,
  ].join("\n");
}
