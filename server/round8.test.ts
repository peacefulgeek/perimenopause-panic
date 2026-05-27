import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");

describe("Round 8 — auto-heal mirror + diagnostics + queue top-up", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ----- (1) boot-time Bunny mirror auto-heal --------------------------------

  it("auditBunnyMirror returns shape with totalPublished/mirroredOk/missing/cdnHost/checkedAt", async () => {
    vi.doMock("./lib/articles", () => ({
      listAllPublishedSlugs: async () => [
        { slug: "alpha" },
        { slug: "beta" },
        { slug: "gamma" },
      ],
      getArticleBySlug: async () => null,
    }));
    vi.doMock("./lib/bunny", () => ({
      bunnyExists: async (path: string) => path.includes("alpha") || path.includes("gamma"),
    }));
    const mod = await import("./lib/bunnyMirrorHeal");
    const audit = await mod.auditBunnyMirror({ concurrency: 2 });
    expect(audit.totalPublished).toBe(3);
    expect(audit.mirroredOk).toBe(2);
    expect(audit.missing).toEqual(["beta"]);
    expect(audit.cdnHost).toMatch(/^https?:\/\//);
    expect(typeof audit.checkedAt).toBe("string");
    expect(audit.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("bootBunnyMirrorCheck skips reupload when BUNNY_API_KEY is missing", async () => {
    const before = process.env.BUNNY_API_KEY;
    delete process.env.BUNNY_API_KEY;
    try {
      vi.doMock("./lib/articles", () => ({
        listAllPublishedSlugs: async () => [{ slug: "missing-1" }, { slug: "missing-2" }],
        getArticleBySlug: async () => null,
      }));
      vi.doMock("./lib/bunny", () => ({ bunnyExists: async () => false }));
      const mod = await import("./lib/bunnyMirrorHeal");
      const logs: string[] = [];
      const r = await mod.bootBunnyMirrorCheck({ log: (m) => logs.push(m) });
      expect(r.missing.length).toBe(2);
      expect(r.reuploaded.length).toBe(0);
      expect(logs.some((l) => l.includes("BUNNY_API_KEY is unset"))).toBe(true);
    } finally {
      if (before !== undefined) process.env.BUNNY_API_KEY = before;
    }
  });

  it("bootBunnyMirrorCheck re-uploads missing slugs when BUNNY_API_KEY is set", async () => {
    process.env.BUNNY_API_KEY = "test-key";
    try {
      const reuploaded: string[] = [];
      vi.doMock("./lib/articles", () => ({
        listAllPublishedSlugs: async () => [{ slug: "x" }, { slug: "y" }],
        getArticleBySlug: async (slug: string) => ({
          slug,
          title: slug,
          tags: [],
          asinsUsed: [],
          internalLinksUsed: [],
          publishedAt: new Date(),
          lastModifiedAt: new Date(),
        }) as any,
      }));
      vi.doMock("./lib/bunny", () => ({ bunnyExists: async () => false }));
      vi.doMock("./lib/articleJson", async () => {
        const actual = await vi.importActual<any>("./lib/articleJson");
        return {
          ...actual,
          uploadArticleJson: async (row: any) => {
            reuploaded.push(row.slug);
            return { ok: true, status: 201, url: `https://cdn/${row.slug}.json` };
          },
        };
      });
      const mod = await import("./lib/bunnyMirrorHeal");
      const r = await mod.bootBunnyMirrorCheck({ concurrency: 2, log: () => {} });
      expect(r.missing).toEqual(["x", "y"]);
      expect(r.reuploaded.every((u) => u.ok)).toBe(true);
      expect(reuploaded.sort()).toEqual(["x", "y"]);
    } finally {
      delete process.env.BUNNY_API_KEY;
    }
  });

  it("bootBunnyMirrorCheck never throws even when audit fails internally", async () => {
    vi.doMock("./lib/articles", () => ({
      listAllPublishedSlugs: async () => {
        throw new Error("db-down");
      },
      getArticleBySlug: async () => null,
    }));
    vi.doMock("./lib/bunny", () => ({ bunnyExists: async () => true }));
    const mod = await import("./lib/bunnyMirrorHeal");
    const logs: string[] = [];
    const r = await mod.bootBunnyMirrorCheck({ log: (m) => logs.push(m) });
    expect(r.totalPublished).toBe(0);
    expect(r.missing).toEqual([]);
    expect(r.reuploaded).toEqual([]);
    expect(logs.some((l) => l.includes("audit failed"))).toBe(true);
  });

  // ----- (2) /api/diagnostics/bunny-mirror endpoint --------------------------

  it("siteRoutes.ts registers GET /api/diagnostics/bunny-mirror and calls auditBunnyMirror", () => {
    const src = readFileSync(resolve(root, "server/siteRoutes.ts"), "utf8");
    expect(src).toMatch(/app\.get\(["']\/api\/diagnostics\/bunny-mirror["']/);
    expect(src).toMatch(/auditBunnyMirror\(\)/);
    // Endpoint MUST NOT mutate Bunny — no upload import, no bootBunnyMirrorCheck.
    expect(src).not.toMatch(/bootBunnyMirrorCheck\(/);
    expect(src).not.toMatch(/uploadArticleJson\(/);
  });

  // ----- (3) seedNext.ts queue top-up ---------------------------------------

  it("seedNext.generateCandidates returns N unique slugs and never collides with seed500's grid", async () => {
    const { generateCandidates } = await import("./scripts/seedNext");
    const list = generateCandidates(120);
    expect(list.length).toBe(120);
    const slugs = new Set(list.map((c) => c.slug));
    expect(slugs.size).toBe(list.length); // every slug unique
    const SEASONS = ["winter", "spring", "summer", "autumn"];
    const HORIZONS = ["this-year", "the-next-5-years", "decade-two"];
    for (const c of list) {
      const hasNew =
        SEASONS.some((s) => c.slug.includes(s)) ||
        HORIZONS.some((h) => c.slug.includes(h)) ||
        // Long inputs can be truncated past the season/horizon tokens; in
        // that case the deterministic 8-char hash suffix keeps slugs unique.
        /-[0-9a-f]{8}$/.test(c.slug);
      expect(hasNew, `slug "${c.slug}" should include a new-dimension token or hash suffix`).toBe(true);
    }
  });

  it("seedNext.generateCandidates is deterministic across runs", async () => {
    const { generateCandidates } = await import("./scripts/seedNext");
    const a = generateCandidates(50).map((c) => c.slug);
    const b = generateCandidates(50).map((c) => c.slug);
    expect(a).toEqual(b);
  });

  it("seedNext.ts source file uses idempotent existing-slug filter (same pattern as seed500)", () => {
    const src = readFileSync(resolve(root, "server/scripts/seedNext.ts"), "utf8");
    expect(src).toMatch(/existingSet/);
    expect(src).toMatch(/!existingSet\.has/);
    expect(src).toMatch(/status:\s*["']queued["']\s*as\s*const/);
  });

  // ----- (4) boot wiring sanity ---------------------------------------------

  it("server/_core/index.ts schedules bootBunnyMirrorCheck after listen and skips it under NODE_ENV=test", () => {
    const src = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");
    expect(src).toMatch(/import\s+\{\s*bootBunnyMirrorCheck\s*\}/);
    expect(src).toMatch(/bootBunnyMirrorCheck\(\)/);
    expect(src).toMatch(/process\.env\.NODE_ENV\s*!==\s*["']test["']/);
    expect(src).toMatch(/DISABLE_BOOT_MIRROR_CHECK/);
    const listenIdx = src.indexOf("httpServer.listen(port");
    const bootIdx = src.indexOf("bootBunnyMirrorCheck()");
    expect(bootIdx).toBeGreaterThan(listenIdx);
  });
});
