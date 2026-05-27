import type { Article } from "../../drizzle/schema";
import { SITE, publicBaseUrl } from "./siteConfig";
import { listPublishedFromBunny } from "./articleStore";

export function buildRobotsTxt(): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${apex}/sitemap.xml
`;
}

export async function buildSitemapXml(): Promise<string> {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const articles = await listPublishedFromBunny();
  const staticPages = [
    { loc: `${apex}/`, priority: 1.0, changefreq: "daily" },
    { loc: `${apex}/articles`, priority: 0.9, changefreq: "daily" },
    { loc: `${apex}/about`, priority: 0.6, changefreq: "monthly" },
    { loc: `${apex}/tools-we-recommend`, priority: 0.7, changefreq: "weekly" },
    { loc: `${apex}/disclosures`, priority: 0.4, changefreq: "yearly" },
    { loc: `${apex}/privacy`, priority: 0.4, changefreq: "yearly" },
    { loc: `${apex}/contact`, priority: 0.4, changefreq: "yearly" },
  ];
  const urls = [
    ...staticPages.map(
      (p) =>
        `  <url><loc>${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`,
    ),
    ...articles.map((a) => {
      const last = a.lastModifiedAt
        ? new Date(a.lastModifiedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      return `  <url><loc>${apex}/articles/${a.slug}</loc><lastmod>${last}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }),
  ].join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

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
  lines.push("");
  lines.push("## Pages");
  lines.push(`- [Home](${apex}/)`);
  lines.push(`- [Articles](${apex}/articles)`);
  lines.push(`- [Tools We Recommend](${apex}/tools-we-recommend)`);
  lines.push(`- [About](${apex}/about)`);
  lines.push(`- [Disclosures](${apex}/disclosures)`);
  lines.push(`- [Privacy](${apex}/privacy)`);
  lines.push(`- [Contact](${apex}/contact)`);
  lines.push("");
  lines.push("## Recent articles");
  for (const a of articles.slice(0, 60)) {
    lines.push(`- [${a.title}](${apex}/articles/${a.slug}) — ${a.metaDescription}`);
  }
  return lines.join("\n") + "\n";
}

export async function buildLlmsFullTxt(): Promise<string> {
  // The "full" variant is a flat-text dump of every published article body
  // for LLM indexers. Strips HTML tags down to plain text.
  const apex = publicBaseUrl().replace(/\/$/, "");
  const { listPublishedArticles } = await import("./articles");
  const all = await listPublishedArticles(500);
  const out: string[] = [
    `# ${SITE.name} — full corpus`,
    `# ${SITE.tagline}`,
    `# Apex: ${apex}`,
    "",
  ];
  for (const a of all) {
    out.push("---");
    out.push(`Title: ${a.title}`);
    out.push(`URL: ${apex}/articles/${a.slug}`);
    out.push(`Published: ${a.publishedAt ? new Date(a.publishedAt).toISOString() : ""}`);
    out.push(`Author: ${a.author}`);
    out.push("");
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
  author: string | { name: string; site?: string; title?: string };
};

export function articleJsonLd(a: ArticleLike): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const url = `${apex}/articles/${a.slug}`;
  const datePublished = a.publishedAt
    ? new Date(a.publishedAt).toISOString()
    : new Date().toISOString();
  const dateModified = a.lastModifiedAt
    ? new Date(a.lastModifiedAt).toISOString()
    : datePublished;
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: a.title,
    description: a.metaDescription,
    image: [a.heroUrl],
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: typeof a.author === "string" ? a.author : a.author?.name ?? SITE.authorName,
      url:
        typeof a.author === "string"
          ? SITE.authorSite
          : a.author?.site ?? SITE.authorSite,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: apex,
    },
    keywords: (a.tags || []).join(", "),
    articleSection: a.category,
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
      { "@type": "ListItem", position: 3, name: a.title, item: url },
    ],
  };
  return [
    `<script type="application/ld+json">${JSON.stringify(article)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
  ].join("\n");
}

export function homeOrgJsonLd(): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: apex,
    logo: `${SITE.bunny.pullZone}/library/lib-01.webp`,
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
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: apex,
    potentialAction: {
      "@type": "SearchAction",
      target: `${apex}/articles?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return [
    `<script type="application/ld+json">${JSON.stringify(org)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(website)}</script>`,
  ].join("\n");
}

export function injectHead(template: string, parts: string): string {
  // Insert before </head> exactly once.
  if (template.includes("</head>")) {
    return template.replace("</head>", `${parts}\n</head>`);
  }
  return template;
}

export function canonicalLinkFor(path: string): string {
  const apex = publicBaseUrl().replace(/\/$/, "");
  const clean = path.split("?")[0] || "/";
  return `<link rel="canonical" href="${apex}${clean}" />`;
}

export function tldrPreShell(tldr: string): string {
  // Render a copy of the TL;DR before the React shell so AI Overviews can
  // lift it without executing JS. Stripped to text only and wrapped with
  // the master scope's expected attribute.
  const text = tldr.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
