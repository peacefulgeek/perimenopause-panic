/**
 * One-shot backfill: walk every published article in the DB and upload it
 * to Bunny CDN as articles/<slug>.json. Idempotent — safe to re-run.
 *
 * Requires BUNNY_API_KEY in env. If the env var is missing in dev, this
 * script tries one local fallback: it reads /home/ubuntu/.bunny-perimenopause
 * (a `KEY=value` file used only inside the dev sandbox) and copies the value
 * into process.env. Production deployments must set BUNNY_API_KEY directly
 * via the platform's secrets store.
 */
import "dotenv/config";
import { listPublishedArticles } from "../lib/articles";
import { uploadArticleJson, articleJsonUrl } from "../lib/articleJson";

async function main() {
  if (!process.env.BUNNY_API_KEY) {
    // Fallback: load from local credentials file the dev sandbox uses.
    try {
      const fs = await import("node:fs");
      const path = "/home/ubuntu/.bunny-perimenopause";
      if (fs.existsSync(path)) {
        const txt = fs.readFileSync(path, "utf8");
        const m = txt.match(/BUNNY_API_KEY\s*=\s*([^\s]+)/);
        if (m) process.env.BUNNY_API_KEY = m[1];
      }
    } catch {
      /* ignore */
    }
  }
  if (!process.env.BUNNY_API_KEY) {
    console.error("[backfill] BUNNY_API_KEY missing — aborting");
    process.exit(1);
  }

  const all = await listPublishedArticles(500);
  console.log(`[backfill] uploading ${all.length} published articles as JSON to Bunny...`);

  let ok = 0;
  let fail = 0;
  for (const row of all) {
    const res = await uploadArticleJson(row);
    if (res.ok) {
      ok++;
      console.log(`  ✓ ${row.slug.padEnd(60)}  ${articleJsonUrl(row.slug)}`);
    } else {
      fail++;
      console.warn(`  ✗ ${row.slug.padEnd(60)}  ${res.reason || res.status}`);
    }
  }
  console.log(`\n[backfill] done. ok=${ok}  fail=${fail}  total=${all.length}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(err => {
  console.error("[backfill] FAILED:", err);
  process.exit(2);
});
