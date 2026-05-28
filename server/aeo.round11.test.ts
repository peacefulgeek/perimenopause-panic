import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Bunny-backed list/get so the tests don't hit the network.
vi.mock("./lib/articleStore", () => {
  const sample = [
    {
      slug: "perimenopause-and-sleep",
      title: "Perimenopause and Sleep: What Actually Helps",
      metaDescription:
        "Why sleep falls apart in your forties and what works in 2026 — estradiol, progesterone, light, magnesium, and a ruthless evening routine.",
      ogTitle: "Perimenopause and Sleep",
      ogDescription:
        "Why sleep falls apart in your forties and what works in 2026.",
      heroUrl: "https://perimenopause.b-cdn.net/articles/heroes/perimenopause-and-sleep.webp",
      category: "perimenopause",
      tags: ["sleep", "estradiol", "progesterone"],
      wordCount: 2050,
      publishedAt: "2026-04-12T08:00:00.000Z",
      lastModifiedAt: "2026-05-01T08:00:00.000Z",
      tldr: "Track your luteal phase, get progesterone or magnesium glycinate, kill the evening light, and stop blaming yourself.",
      body: `<p>Opening paragraph.</p><h2>What is perimenopause sleep loss?</h2><p>It is the most common reason women in their forties suddenly find themselves wide awake at 3am. Hormones shift, the brain re-wires, and the bedroom must change with it. Track three nights, then act.</p><h2>Why does estrogen matter for sleep?</h2><p>Estrogen interacts with GABA and serotonin pathways, which are the brain's primary sleep gateways. When estrogen drops in the late luteal phase, those pathways thin out and the result is the classic 3am stare. Progesterone has a softer but related effect via allopregnanolone, a metabolite with mild benzodiazepine-like activity.</p><h2>How do I fix it?</h2><p>Start by tracking three nights against your cycle, then layer interventions in this order: light, magnesium, progesterone, estradiol.</p><ol><li>Track three nights of sleep against your cycle phase.</li><li>Cut blue light and dim the bedroom by 21:00.</li><li>Take magnesium glycinate 30 minutes before bed.</li><li>Ask about cyclic progesterone if your luteal phase is wrecked.</li></ol>`,
      conclusion: "",
    },
    {
      slug: "transdermal-vs-oral-estrogen",
      title: "Transdermal vs Oral Estrogen",
      metaDescription: "The 2026 case for transdermal estradiol over oral.",
      ogTitle: "Transdermal vs Oral Estrogen",
      ogDescription: "Why transdermal wins in 2026.",
      heroUrl: "https://perimenopause.b-cdn.net/articles/heroes/transdermal-vs-oral-estrogen.webp",
      category: "hrt",
      tags: ["estradiol", "transdermal"],
      wordCount: 1980,
      publishedAt: "2026-03-10T08:00:00.000Z",
      lastModifiedAt: "2026-04-15T08:00:00.000Z",
      tldr: "Patches, gels and sprays bypass the liver and lower clot risk. Pills do not.",
      body: "<p>body content here</p>",
      conclusion: "",
    },
  ];
  return {
    listPublishedFromBunny: async () => sample,
    getArticleFromBunny: async (slug: string) =>
      sample.find((s) => s.slug === slug) || null,
    countByStatusFromBunny: async () => ({ published: 2, queued: 0, total: 2 }),
  };
});

import {
  buildRobotsTxt,
  buildSitemapXml,
  buildLlmsTxt,
  articleJsonLd,
  articleHeadMeta,
  homeOrgJsonLd,
  aboutPageJsonLd,
  collectionPageJsonLd,
  canonicalLinkFor,
  extractFaqFromBody,
  extractHowToFromBody,
} from "./lib/aeo";

describe("robots.txt round 11", () => {
  it("explicitly allows the full AI crawler matrix", () => {
    const txt = buildRobotsTxt();
    const required = [
      "GPTBot",
      "ChatGPT-User",
      "OAI-SearchBot",
      "ClaudeBot",
      "Claude-Web",
      "anthropic-ai",
      "PerplexityBot",
      "Perplexity-User",
      "Google-Extended",
      "Bingbot",
      "CCBot",
      "Applebot",
      "Applebot-Extended",
      "DuckAssistBot",
      "Meta-ExternalAgent",
      "YouBot",
      "MistralAI-User",
      "Cohere-AI",
    ];
    for (const ua of required) {
      expect(txt).toMatch(new RegExp(`User-agent: ${ua}\\s*\\nAllow: /`));
    }
    expect(txt).toMatch(/Sitemap: .+\/sitemap\.xml/);
    expect(txt).toMatch(/Sitemap: .+\/llms\.txt/);
    expect(txt).toMatch(/Sitemap: .+\/llms-full\.txt/);
  });
});

describe("sitemap.xml round 11", () => {
  it("includes ISO-8601 lastmod and apex pages", async () => {
    const xml = await buildSitemapXml();
    expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
    expect(xml).toMatch(/<loc>.+\/<\/loc>/); // root
    expect(xml).toMatch(/<loc>.+\/articles<\/loc>/);
    expect(xml).toMatch(/<loc>.+\/articles\/perimenopause-and-sleep<\/loc>/);
    // ISO-8601: 2026-...T...Z
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T/);
  });

  it("lists newer articles before older ones", async () => {
    const xml = await buildSitemapXml();
    const i1 = xml.indexOf("/articles/perimenopause-and-sleep");
    const i2 = xml.indexOf("/articles/transdermal-vs-oral-estrogen");
    expect(i1).toBeGreaterThan(0);
    expect(i2).toBeGreaterThan(0);
    expect(i1).toBeLessThan(i2); // sleep is newer
  });
});

describe("llms.txt round 11", () => {
  it("groups by category and links to llms-full.txt", async () => {
    const txt = await buildLlmsTxt();
    expect(txt).toMatch(/^# Perimenopause Panic/);
    expect(txt).toMatch(/Full corpus: .+\/llms-full\.txt/);
    expect(txt).toMatch(/## Perimenopause/);
    expect(txt).toMatch(/## Hrt/);
    expect(txt).toMatch(/\/articles\/perimenopause-and-sleep/);
    expect(txt).toMatch(/\/articles\/transdermal-vs-oral-estrogen/);
  });
});

describe("article JSON-LD round 11", () => {
  it("emits Article + BreadcrumbList + FAQPage from question H2s", async () => {
    const { listPublishedFromBunny } = await import("./lib/articleStore");
    const a = (await listPublishedFromBunny())[0];
    const ld = articleJsonLd(a as any);
    expect(ld).toMatch(/"@type":"Article"/);
    expect(ld).toMatch(/"@type":"BreadcrumbList"/);
    expect(ld).toMatch(/"@type":"FAQPage"/);
    // Article fields
    expect(ld).toMatch(/"inLanguage":"en-US"/);
    expect(ld).toMatch(/"isAccessibleForFree":true/);
    expect(ld).toMatch(/"wordCount":2050/);
    expect(ld).toMatch(/"speakable"/);
    expect(ld).toMatch(/"author".*"@type":"Person"/);
    expect(ld).toMatch(/"reviewedBy"/);
    // Breadcrumb has 4 list items including category
    expect(ld).toMatch(/"position":4/);
  });
});

describe("FAQ + HowTo extraction", () => {
  it("only emits FAQPage when at least 2 question headings have substantial answers", () => {
    const noQ = "<h2>Background</h2><p>Some text.</p>";
    expect(extractFaqFromBody(noQ).length).toBe(0);

    const oneQ =
      "<h2>What is it?</h2><p>" + "answer text ".repeat(20) + "</p>";
    expect(extractFaqFromBody(oneQ).length).toBe(1);

    const twoQ =
      oneQ + "<h2>How does it work?</h2><p>" + "more answer ".repeat(20) + "</p>";
    expect(extractFaqFromBody(twoQ).length).toBe(2);
  });

  it("emits HowTo only when ordered list has 3+ verb-first steps", () => {
    const noOl = "<p>nothing</p>";
    expect(extractHowToFromBody(noOl, "Title")).toBeNull();

    const fewOl = "<ol><li>Track</li><li>Stop</li></ol>";
    expect(extractHowToFromBody(fewOl, "Title")).toBeNull();

    const realOl =
      "<ol><li>Track three nights of sleep against your cycle phase.</li>" +
      "<li>Cut blue light and dim the bedroom by 21:00.</li>" +
      "<li>Take magnesium glycinate 30 minutes before bed.</li></ol>";
    const ld = extractHowToFromBody(realOl, "Sleep") as any;
    expect(ld).not.toBeNull();
    expect(ld["@type"]).toBe("HowTo");
    expect(ld.step.length).toBe(3);
  });
});

describe("article head meta round 11", () => {
  it("emits canonical, og:type article, twitter, robots, article:published/modified", async () => {
    const { listPublishedFromBunny } = await import("./lib/articleStore");
    const a = (await listPublishedFromBunny())[0];
    const meta = articleHeadMeta(a as any);
    expect(meta).toMatch(/<link rel="canonical" href=".+\/articles\/perimenopause-and-sleep" \/>/);
    expect(meta).toMatch(/<meta property="og:type" content="article" \/>/);
    expect(meta).toMatch(/<meta name="twitter:card" content="summary_large_image" \/>/);
    expect(meta).toMatch(/<meta name="robots" content="index, follow/);
    expect(meta).toMatch(/<meta property="article:published_time" content="2026-04-12T08:00:00\.000Z" \/>/);
    expect(meta).toMatch(/<meta property="article:modified_time" content="2026-05-01T08:00:00\.000Z" \/>/);
    expect(meta).toMatch(/<meta property="article:author" content="The Oracle Lover" \/>/);
  });
});

describe("page-specific JSON-LD", () => {
  it("home: Organization + WebSite + Person", () => {
    const ld = homeOrgJsonLd();
    expect(ld).toMatch(/"@type":"Organization"/);
    expect(ld).toMatch(/"@type":"WebSite"/);
    expect(ld).toMatch(/"@type":"Person"/);
    expect(ld).toMatch(/SearchAction/);
  });

  it("about: AboutPage with mainEntity Person", () => {
    const ld = aboutPageJsonLd();
    expect(ld).toMatch(/"@type":"AboutPage"/);
    expect(ld).toMatch(/"jobTitle"/);
  });

  it("collection: CollectionPage with ItemList", async () => {
    const ld = await collectionPageJsonLd();
    expect(ld).toMatch(/"@type":"CollectionPage"/);
    expect(ld).toMatch(/"@type":"ItemList"/);
    expect(ld).toMatch(/"numberOfItems":2/);
    expect(ld).toMatch(/perimenopause-and-sleep/);
  });
});

describe("canonical cleanup", () => {
  it("strips utm_*, fbclid, gclid, mc_eid", () => {
    const link = canonicalLinkFor(
      "/articles/perimenopause-and-sleep?utm_source=x&utm_medium=y&fbclid=z&q=keep",
    );
    expect(link).toMatch(/canonical/);
    expect(link).not.toMatch(/utm_/);
    expect(link).not.toMatch(/fbclid/);
    expect(link).toMatch(/q=keep/);
  });

  it("collapses trailing slashes", () => {
    const link = canonicalLinkFor("/articles/");
    expect(link).toMatch(/\/articles" \/>/);
  });
});
