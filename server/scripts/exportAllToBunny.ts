/**
 * exportAllToBunny.ts — one-shot: dump every article (queued + published)
 * from the sandbox DB to Bunny as JSON, and rebuild the public manifest at
 * https://perimenopause.b-cdn.net/articles/index.json
 *
 * After this script runs once, the live Railway site never needs the DB
 * again to serve the catalog. The cron is the only writer to Bunny going
 * forward; reads are entirely public.
 *
 * Usage:
 *   pnpm tsx server/scripts/exportAllToBunny.ts
 *   pnpm tsx server/scripts/exportAllToBunny.ts --dry
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { articles } from "../../drizzle/schema";
import {
  buildArticleJsonPayload,
  articleJsonKey,
  articleJsonUrl,
  uploadArticleJson,
} from "../lib/articleJson";
import { bunnyPut } from "../lib/bunny";
import { SITE } from "../lib/siteConfig";

const ENV_PATHS = [
  "/home/ubuntu/.bunny-perimenopause",
  path.resolve(process.cwd(), ".env"),
];
for (const f of ENV_PATHS) {
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

const DRY = process.argv.includes("--dry");
const VERBOSE = process.argv.includes("--verbose");

if (!process.env.BUNNY_API_KEY) {
  console.error("[export] BUNNY_API_KEY not set; aborting.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("[export] DATABASE_URL not set; aborting.");
  process.exit(1);
}

type Counters = { ok: number; fail: number; failed: string[] };
const counters: Counters = { ok: 0, fail: 0, failed: [] };

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn);
  const rows = await db.select().from(articles).orderBy(articles.id);
  console.log(`[export] loaded ${rows.length} articles from DB`);

  // 1) write per-slug JSON for every row
  const concurrency = Number.parseInt(process.env.EXPORT_CONCURRENCY || "8", 10);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= rows.length) return;
      const row = rows[i];
      if (DRY) {
        if (VERBOSE) console.log(`[dry] would upload ${row.slug}`);
        counters.ok++;
        continue;
      }
      const r = await uploadArticleJson(row);
      if (r.ok) {
        counters.ok++;
        if (VERBOSE || counters.ok % 25 === 0) {
          console.log(`[export] ok ${counters.ok}/${rows.length} ${row.slug}`);
        }
      } else {
        counters.fail++;
        counters.failed.push(`${row.slug}:${r.reason ?? r.status}`);
        console.warn(`[export] FAIL ${row.slug} ${r.reason ?? r.status}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  // 2) build + upload articles/index.json
  const totalPublished = rows.filter((r) => r.status === "published").length;
  const totalQueued = rows.filter((r) => r.status === "queued").length;
  const indexPayload = {
    schemaVersion: 1 as const,
    generatedAt: new Date().toISOString(),
    totalPublished,
    totalQueued,
    cdnHost: SITE.bunny.pullZone,
    articles: rows
      .map((r) => ({
        slug: r.slug,
        title: r.title,
        category: r.category,
        tags: Array.isArray(r.tags) ? r.tags : [],
        publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : null,
        lastModifiedAt: new Date(r.lastModifiedAt).toISOString(),
        metaDescription: r.metaDescription,
        heroUrl: r.heroUrl,
        status: r.status,
        jsonUrl: articleJsonUrl(r.slug),
        wordCount: r.wordCount,
      }))
      .sort((a, b) => {
        // published first (most-recent first), then queued by slug
        if (a.status !== b.status) return a.status === "published" ? -1 : 1;
        if (a.status === "published") {
          const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
          const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
          return tb - ta;
        }
        return a.slug.localeCompare(b.slug);
      }),
  };

  if (DRY) {
    console.log(
      `[dry] would publish index.json with ${indexPayload.articles.length} entries (` +
        `${indexPayload.totalPublished} published, ${indexPayload.totalQueued} queued)`,
    );
  } else {
    const body = Buffer.from(JSON.stringify(indexPayload, null, 2), "utf8");
    const res = await bunnyPut("articles/index.json", body, "application/json");
    if (!res.ok) {
      console.error(`[export] failed to upload index.json: ${res.status}`);
    } else {
      console.log(
        `[export] index.json uploaded: ${SITE.bunny.pullZone}/articles/index.json (${indexPayload.articles.length} entries)`,
      );
    }
  }

  await conn.end();

  console.log(
    `[export] done. ok=${counters.ok} fail=${counters.fail} ` +
      (counters.fail ? `failures=${counters.failed.slice(0, 10).join(",")}` : ""),
  );
  if (counters.fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error("[export] fatal:", e);
  process.exit(1);
});
