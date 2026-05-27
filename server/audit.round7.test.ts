import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");

describe("Round-7 audit fixes", () => {
  it("Defect 1: deepseek.ts has NO hard-coded API key fallback (sk-...)", () => {
    const src = readFileSync(resolve(root, "server/lib/deepseek.ts"), "utf8");
    expect(src).not.toMatch(/sk-[A-Za-z0-9]{12,}/);
    expect(src).toMatch(/process\.env\.OPENAI_API_KEY/);
    expect(src).toMatch(/throw new Error\([^)]*OPENAI_API_KEY/);
  });

  it("Defect 1: deepseek.ts throws at first call when OPENAI_API_KEY is missing", async () => {
    const before = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      vi.resetModules();
      const mod = await import("./lib/deepseek");
      await expect(
        mod.callDeepSeek({ system: "s", user: "u" }),
      ).rejects.toThrow(/OPENAI_API_KEY/);
    } finally {
      if (before !== undefined) process.env.OPENAI_API_KEY = before;
    }
  });

  it("Defect 2: client/articlesApi.ts uses AbortController and checks r.ok on the list endpoint", () => {
    const src = readFileSync(
      resolve(root, "client/src/lib/articlesApi.ts"),
      "utf8",
    );
    expect(src).toMatch(/AbortController/);
    expect(src).toMatch(/ctrl\.abort/);
    const useArticlesBlock = src.split("export function useArticle(")[0];
    expect(useArticlesBlock).toMatch(/r\.ok/);
  });

  it("Defect 2: useArticle resets prior state when slug changes", () => {
    const src = readFileSync(
      resolve(root, "client/src/lib/articlesApi.ts"),
      "utf8",
    );
    const useArticleBlock = src.split("export function useArticle(")[1] || "";
    expect(useArticleBlock).toMatch(/setData\(null\)/);
    expect(useArticleBlock).toMatch(/setError\(null\)/);
  });

  it("Defect 4: SITE.amazonTag is the single source of truth (no inline 'spankyspinola-20' in code that builds links)", () => {
    const files = [
      "server/lib/qualityGate.ts",
      "server/scripts/auditAsins.ts",
      "server/scripts/swapAmazonLinks.ts",
    ];
    for (const f of files) {
      const src = readFileSync(resolve(root, f), "utf8");
      expect(src, `${f} must import SITE`).toMatch(
        /from ["'](?:\.\.\/)*lib\/siteConfig["']|from ["']\.\/siteConfig["']/,
      );
      expect(src, `${f} must NOT contain a literal spankyspinola-20`)
        .not.toMatch(/['"]spankyspinola-20['"]/);
    }
    const siteSrc = readFileSync(
      resolve(root, "server/lib/siteConfig.ts"),
      "utf8",
    );
    expect(siteSrc).toMatch(/amazonTag:\s*"spankyspinola-20"/);
  });

  it("Defect 7: /api/articles is registered and returns a bare JSON array of summaries", () => {
    const src = readFileSync(
      resolve(root, "server/siteRoutes.ts"),
      "utf8",
    );
    expect(src).toMatch(/app\.get\(["']\/api\/articles["']/);
    // Bunny-only refactor: list source is the Bunny CDN store, not the database.
    expect(src).toMatch(/articleStore/);
    expect(src).toMatch(/listPublishedFromBunny/);
    expect(src).toMatch(/res\.json\(list\)/);
  });
});
