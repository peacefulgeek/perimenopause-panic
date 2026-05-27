import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PUBLISHED_CAP } from "./cron";

describe("Published-article cap (Railway readiness)", () => {
  it("PUBLISHED_CAP defaults to 100", () => {
    expect(PUBLISHED_CAP).toBe(100);
  });

  it("cron.ts gates runPublisher behind PUBLISHED_CAP", () => {
    const src = readFileSync(resolve(__dirname, "cron.ts"), "utf8");
    expect(src).toMatch(/publishedCount\s*>=\s*PUBLISHED_CAP/);
    expect(src).toMatch(/published-cap-reached/);
  });
});

describe("Railway deployment artifacts (Railpack-only)", () => {
  const root = resolve(__dirname, "..");

  it("does NOT ship a Dockerfile (lessons 1, 7, 8 — avoid CMD/startCommand conflict and stale cache)", () => {
    expect(existsSync(resolve(root, "Dockerfile"))).toBe(false);
  });

  it("does NOT ship a nixpacks.toml (lesson 1 — avoid Caddy injection)", () => {
    expect(existsSync(resolve(root, "nixpacks.toml"))).toBe(false);
  });

  it("railway.json has only startCommand + restart policy, no healthcheck, no builder", () => {
    const j = JSON.parse(readFileSync(resolve(root, "railway.json"), "utf8"));
    expect(j.deploy.startCommand).toBe("pnpm start");
    expect(j.deploy.healthcheckPath).toBeUndefined();
    expect(j.deploy.healthcheckTimeout).toBeUndefined();
    expect(j.build).toBeUndefined();
  });

  it("ships a Procfile with a web process", () => {
    const f = readFileSync(resolve(root, "Procfile"), "utf8");
    expect(f).toMatch(/^web:\s*pnpm start/m);
  });

  it("package.json pins pnpm@10.4.1 exactly via packageManager (lesson 3)", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    expect(pkg.packageManager).toMatch(/^pnpm@10\.4\.1/);
  });

  it("server entry installs uncaughtException + unhandledRejection handlers as the first executable code (lesson 4)", () => {
    const src = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");
    expect(src).toMatch(/process\.on\("uncaughtException"/);
    expect(src).toMatch(/process\.on\("unhandledRejection"/);
    // Verify they appear BEFORE the first import statement.
    const firstImportIdx = src.indexOf("import ");
    const uncaughtIdx = src.indexOf('process.on("uncaughtException"');
    expect(uncaughtIdx).toBeGreaterThan(-1);
    expect(uncaughtIdx).toBeLessThan(firstImportIdx);
  });

  it("server entry attaches httpServer.on('error') handler (lesson 4)", () => {
    const src = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");
    expect(src).toMatch(/httpServer\.on\(\s*"error"/);
  });

  it("server defaults port to 8080 in production, 3000 in dev (lesson 5)", () => {
    const src = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");
    expect(src).toMatch(/isProduction\s*\?\s*8080\s*:\s*3000/);
    expect(src).toMatch(/process\.env\.PORT/);
  });

  it("server binds to process.env.PORT exactly in production (no port-walk)", () => {
    const src = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");
    expect(src).toMatch(/isProduction\s*\?\s*preferredPort\s*:\s*await findAvailablePort/);
  });

  it("ships DEPLOY-RAILWAY.md with the env contract", () => {
    const f = readFileSync(resolve(root, "DEPLOY-RAILWAY.md"), "utf8");
    expect(f).toMatch(/DATABASE_URL/);
    expect(f).toMatch(/OPENAI_API_KEY/);
    expect(f).toMatch(/PUBLISHED_CAP/);
    expect(f).toMatch(/AUTO_GEN_ENABLED/);
    expect(f).toMatch(/BUNNY_PULL_ZONE/);
    expect(f).toMatch(/Railpack/);
  });
});
