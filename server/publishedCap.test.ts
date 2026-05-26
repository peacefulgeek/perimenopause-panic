import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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

describe("Railway deployment artifacts", () => {
  const root = resolve(__dirname, "..");

  it("ships a Dockerfile that uses node:22 and binds via pnpm start", () => {
    const f = readFileSync(resolve(root, "Dockerfile"), "utf8");
    expect(f).toMatch(/FROM node:22/);
    expect(f).toMatch(/pnpm build/);
    expect(f).toMatch(/CMD\s*\[\s*"pnpm",\s*"start"\s*\]/);
    expect(f).toMatch(/HEALTHCHECK[\s\S]+\/health/);
  });

  it("ships a railway.json with /health healthcheck", () => {
    const j = JSON.parse(readFileSync(resolve(root, "railway.json"), "utf8"));
    expect(j.deploy.healthcheckPath).toBe("/health");
    expect(j.deploy.startCommand).toBe("pnpm start");
  });

  it("ships a Procfile with a web process", () => {
    const f = readFileSync(resolve(root, "Procfile"), "utf8");
    expect(f).toMatch(/^web:\s*pnpm start/m);
  });

  it("server binds to process.env.PORT exactly in production", () => {
    const src = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");
    expect(src).toMatch(/process\.env\.PORT/);
    expect(src).toMatch(/NODE_ENV\s*===\s*"production"\s*\?\s*preferredPort/);
  });

  it("ships DEPLOY-RAILWAY.md with the env contract", () => {
    const f = readFileSync(resolve(root, "DEPLOY-RAILWAY.md"), "utf8");
    expect(f).toMatch(/DATABASE_URL/);
    expect(f).toMatch(/OPENAI_API_KEY/);
    expect(f).toMatch(/PUBLISHED_CAP/);
    expect(f).toMatch(/AUTO_GEN_ENABLED/);
    expect(f).toMatch(/BUNNY_PULL_ZONE/);
  });
});
