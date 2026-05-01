import { describe, it, expect } from "vitest";
import {
  runQualityGate,
  countWordsFromHtml,
  AI_FLAGGED_WORDS,
  AI_FLAGGED_PHRASES,
} from "./lib/qualityGate";
import { ARTICLE_BLUEPRINTS } from "./lib/blueprints";
import { buildSeedArticle } from "./lib/seedBody";
import { buildRobotsTxt } from "./lib/aeo";

describe("qualityGate ban lists are not silently truncated", () => {
  it("includes the canonical AI-tell words from the master scope", () => {
    for (const w of [
      "delve",
      "tapestry",
      "leverage",
      "seamlessly",
      "robust",
      "holistic",
      "transformative",
      "nuanced",
      "multifaceted",
      "groundbreaking",
      "paradigm",
    ]) {
      expect(AI_FLAGGED_WORDS).toContain(w);
    }
  });
  it("includes the canonical AI-tell phrases from the master scope", () => {
    for (const p of [
      "in conclusion,",
      "it's worth noting that",
      "unlock your potential",
      "dive deep into",
      "in the realm of",
    ]) {
      expect(AI_FLAGGED_PHRASES).toContain(p);
    }
  });
});

describe("qualityGate flags the obvious failures", () => {
  it("rejects an em-dash", () => {
    const body = `<section data-tldr="ai-overview"><p>x — y</p></section>`;
    const res = runQualityGate({ body, wordCount: 1500 });
    expect(res.failures.find((f) => f.rule === "em-or-en-dash")).toBeTruthy();
  });
  it("rejects a banned word", () => {
    const res = runQualityGate({
      body: `Let us delve into this. <section data-tldr="ai-overview"></section>`,
      wordCount: 1500,
    });
    expect(res.failures.find((f) => f.rule === "banned-word")).toBeTruthy();
  });
  it("rejects missing TL;DR section", () => {
    const res = runQualityGate({ body: `<p>hi</p>`, wordCount: 1500 });
    expect(res.failures.find((f) => f.rule === "eeat-missing-tldr")).toBeTruthy();
  });
  it("rejects an Amazon link without the spankyspinola-20 tag", () => {
    const body = `<section data-tldr="ai-overview"><p>x</p></section>
<a href="https://www.amazon.com/dp/B0019LRY8A?tag=other-22">x</a> (paid link)
<a href="https://www.amazon.com/dp/B00CAZAU62?tag=other-22">y</a> (paid link)
<a href="https://www.amazon.com/dp/B00JGCBGZQ?tag=other-22">z</a> (paid link)
<aside class="author-byline"><time datetime="2026-04-30">x</time></aside>
<a href="/articles/a">A</a><a href="/articles/b">B</a><a href="/articles/c">C</a>
<a href="https://www.nih.gov/x">x</a>
In our experience writing about perimenopause, this is a thing.`;
    const res = runQualityGate({ body, wordCount: 1500 });
    expect(
      res.failures.find((f) => f.rule === "amazon-links-out-of-range"),
    ).toBeTruthy();
  });
  it("rejects author leakage", () => {
    const body = `<p>Paul Wagner is the author.</p><section data-tldr="ai-overview"></section>`;
    const res = runQualityGate({ body, wordCount: 1500 });
    expect(res.failures.find((f) => f.rule === "author-leakage")).toBeTruthy();
  });
});

describe("seedBody passes the quality gate for every blueprint", () => {
  it("builds and gates all 30 blueprints", () => {
    expect(ARTICLE_BLUEPRINTS.length).toBe(30);
    const day = new Date("2026-04-29T12:00:00Z");
    for (const bp of ARTICLE_BLUEPRINTS) {
      const built = buildSeedArticle(bp, ARTICLE_BLUEPRINTS, day);
      expect(built.wordCount).toBeGreaterThanOrEqual(1200);
      expect(built.wordCount).toBeLessThanOrEqual(2500);
      const gate = runQualityGate({
        body: built.body,
        wordCount: built.wordCount,
      });
      if (!gate.ok) {
        // surface the failures in the test output for fast triage
        throw new Error(
          `Gate failed for ${bp.slug}: ${gate.failures.map((f) => f.rule + (f.detail ? ":" + f.detail : "")).join(", ")}`,
        );
      }
      expect(gate.ok).toBe(true);
    }
  });
});

describe("countWordsFromHtml strips markup and counts words", () => {
  it("ignores tags and styles", () => {
    expect(countWordsFromHtml(`<p>one two <em>three</em></p>`)).toBe(3);
  });
});

describe("robots.txt allows the AI bots that the master scope requires", () => {
  it("allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended", () => {
    const txt = buildRobotsTxt();
    for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      expect(txt).toMatch(new RegExp(`User-agent: ${bot}\\s+Allow: /`));
    }
    expect(txt).toMatch(/Sitemap: https:\/\/perimenopausepanic\.com\/sitemap\.xml/);
  });
});
