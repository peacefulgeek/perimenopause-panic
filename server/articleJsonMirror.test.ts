import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildArticleJsonPayload,
  articleJsonKey,
  articleJsonUrl,
} from "./lib/articleJson";
import type { Article } from "../drizzle/schema";

const sampleRow: Article = {
  id: 7,
  slug: "perimenopause-rage",
  title: "Perimenopause Rage Is Not a Character Flaw",
  metaDescription: "A short note on the surge of anger that comes with perimenopause.",
  ogTitle: "Perimenopause Rage",
  ogDescription: "Not a character flaw.",
  category: "Mental Health",
  tags: ["rage", "mood", "perimenopause"],
  imageAlt: "Watercolor portrait in soft rose and mauve.",
  readingTime: 6,
  author: "The Oracle Lover",
  status: "published",
  publishedAt: new Date("2026-04-12T10:00:00.000Z"),
  lastModifiedAt: new Date("2026-04-12T10:00:00.000Z"),
  wordCount: 1480,
  heroUrl: "https://perimenopause.b-cdn.net/library/lib-08.webp",
  asinsUsed: ["B0XXX111", "B0XXX222"],
  internalLinksUsed: ["perimenopause-vs-pms", "perimenopausal-anxiety"],
  body: "<p>...</p>",
  tldr: "Rage in perimenopause is hormonal, not personal.",
  opener: "story",
  conclusion: "reflection",
  createdAt: new Date("2026-04-12T10:00:00.000Z"),
};

describe("Article JSON mirror — payload shape", () => {
  it("builds a stable schemaVersion=1 payload with all public fields", () => {
    const p = buildArticleJsonPayload(sampleRow);
    expect(p.schemaVersion).toBe(1);
    expect(p.slug).toBe("perimenopause-rage");
    expect(p.title).toBe(sampleRow.title);
    expect(p.author.name).toBe("The Oracle Lover");
    expect(p.author.site).toBe("https://theoraclelover.com");
    expect(p.site.apex).toBe("perimenopausepanic.com");
    expect(p.canonical).toBe("https://perimenopausepanic.com/articles/perimenopause-rage");
    expect(p.jsonUrl).toBe("https://perimenopause.b-cdn.net/articles/perimenopause-rage.json");
    expect(p.tags).toEqual(["rage", "mood", "perimenopause"]);
    expect(p.asinsUsed).toEqual(["B0XXX111", "B0XXX222"]);
    expect(p.publishedAt).toBe("2026-04-12T10:00:00.000Z");
    expect(p.heroUrl.startsWith("https://perimenopause.b-cdn.net/")).toBe(true);
  });

  it("articleJsonKey + articleJsonUrl follow articles/<slug>.json convention on the Bunny pull zone", () => {
    expect(articleJsonKey("foo-bar")).toBe("articles/foo-bar.json");
    expect(articleJsonUrl("foo-bar")).toBe(
      "https://perimenopause.b-cdn.net/articles/foo-bar.json",
    );
  });

  it("tolerates null tags / asins / internalLinks arrays by returning [] rather than throwing", () => {
    const odd = {
      ...sampleRow,
      tags: null as unknown as string[],
      asinsUsed: null as unknown as string[],
      internalLinksUsed: null as unknown as string[],
    } as Article;
    const p = buildArticleJsonPayload(odd);
    expect(p.tags).toEqual([]);
    expect(p.asinsUsed).toEqual([]);
    expect(p.internalLinksUsed).toEqual([]);
  });
});

describe("Article JSON mirror — wiring", () => {
  const root = resolve(__dirname, "..");

  it("cron.ts imports uploadArticleJson and calls it after publishing", () => {
    const src = readFileSync(resolve(root, "server/cron.ts"), "utf8");
    expect(src).toMatch(/from\s+["']\.\/lib\/articleJson["']/);
    // Called in both branches of runPublisher
    const matches = src.match(/uploadArticleJson\(/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("ships the one-shot backfill script", () => {
    const src = readFileSync(
      resolve(root, "server/scripts/backfillArticleJson.ts"),
      "utf8",
    );
    expect(src).toMatch(/listPublishedArticles/);
    expect(src).toMatch(/uploadArticleJson/);
    expect(src).toMatch(/BUNNY_API_KEY/);
  });
});

describe("Railway env contract doc", () => {
  const root = resolve(__dirname, "..");
  const doc = readFileSync(resolve(root, "DEPLOY-RAILWAY.md"), "utf8");

  it("lists every key from the canonical env block", () => {
    for (const key of [
      "NODE_ENV",
      "AUTO_GEN_ENABLED",
      "AMAZON_TAG",
      "JWT_SECRET",
      "OPENAI_API_KEY",
      "OPENAI_BASE_URL",
      "OPENAI_MODEL",
      "FAL_KEY",
      "GH_PAT",
    ]) {
      expect(doc.includes(key)).toBe(true);
    }
  });

  it("references the Bunny JSON mirror endpoint", () => {
    expect(doc).toMatch(/articles\/<slug>\.json/);
    expect(doc).toMatch(/perimenopause\.b-cdn\.net/);
  });

  it("amazon tag is the only one allowed: spankyspinola-20", () => {
    expect(doc).toMatch(/spankyspinola-20/);
  });
});
