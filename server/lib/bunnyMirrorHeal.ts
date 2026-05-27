/**
 * bunnyMirrorHeal.ts — keep the public Bunny CDN mirror in sync with the DB.
 *
 * Two entry points share the same core:
 *   - `auditBunnyMirror()` walks every published article, HEADs each
 *     `articles/<slug>.json` on the Bunny pull-zone, and reports which
 *     slugs are missing. Used by `GET /api/diagnostics/bunny-mirror`.
 *   - `bootBunnyMirrorCheck()` runs the audit at server startup and, for
 *     any missing slug, fetches the full DB row and re-uploads the JSON
 *     payload via `uploadArticleJson`. Best-effort, never throws.
 *
 * Concurrency is bounded so a 500-article corpus doesn't open 500 sockets.
 */
import { listAllPublishedSlugs, getArticleBySlug } from "./articles";
import { articleJsonKey, articleJsonUrl, uploadArticleJson } from "./articleJson";
import { bunnyExists } from "./bunny";
import { SITE } from "./siteConfig";

export type MirrorAudit = {
  totalPublished: number;
  mirroredOk: number;
  missing: string[];
  cdnHost: string;
  checkedAt: string;
  durationMs: number;
};

export type MirrorHealResult = MirrorAudit & {
  reuploaded: { slug: string; ok: boolean; reason?: string }[];
};

/** Bounded-concurrency map. */
async function pmap<T, U>(
  items: T[],
  limit: number,
  fn: (t: T, i: number) => Promise<U>,
): Promise<U[]> {
  const out: U[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * HEAD-check every published article's JSON artifact on Bunny.
 * Pure read — never uploads anything. Safe to expose on a public endpoint.
 */
export async function auditBunnyMirror(opts: { concurrency?: number } = {}): Promise<MirrorAudit> {
  const t0 = Date.now();
  const slugs = await listAllPublishedSlugs();
  const total = slugs.length;
  const concurrency = opts.concurrency ?? 8;

  const results = await pmap(slugs, concurrency, async (s) => {
    const ok = await bunnyExists(articleJsonKey(s.slug));
    return { slug: s.slug, ok };
  });

  const missing = results.filter((r) => !r.ok).map((r) => r.slug);
  return {
    totalPublished: total,
    mirroredOk: total - missing.length,
    missing,
    cdnHost: SITE.bunny.pullZone,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
  };
}

/**
 * Audit + re-upload missing slugs. Used at server boot. Never throws.
 *
 * If `BUNNY_API_KEY` is not set in the environment, the audit still runs
 * (it only needs the pull-zone HEAD) but reuploads are skipped — the
 * function returns the audit with `reuploaded: []` so logs are honest.
 */
export async function bootBunnyMirrorCheck(opts: {
  concurrency?: number;
  log?: (msg: string) => void;
} = {}): Promise<MirrorHealResult> {
  const log = opts.log ?? ((m: string) => console.log(`[bunny-mirror] ${m}`));
  try {
    const audit = await auditBunnyMirror({ concurrency: opts.concurrency ?? 8 });
    if (audit.missing.length === 0) {
      log(`ok — ${audit.mirroredOk}/${audit.totalPublished} mirrored (${audit.durationMs}ms)`);
      return { ...audit, reuploaded: [] };
    }
    if (!process.env.BUNNY_API_KEY) {
      log(
        `audit found ${audit.missing.length} missing JSON artifacts but BUNNY_API_KEY is unset; skipping reupload`,
      );
      return { ...audit, reuploaded: [] };
    }
    log(`auditing found ${audit.missing.length} missing; re-uploading…`);
    const reuploaded = await pmap(audit.missing, 4, async (slug) => {
      try {
        const row = await getArticleBySlug(slug);
        if (!row) return { slug, ok: false, reason: "row-not-found" };
        const r = await uploadArticleJson(row);
        return { slug, ok: r.ok, reason: r.reason };
      } catch (err) {
        return {
          slug,
          ok: false,
          reason: err instanceof Error ? err.message : "unknown",
        };
      }
    });
    const okCount = reuploaded.filter((r) => r.ok).length;
    log(`re-uploaded ${okCount}/${reuploaded.length} missing slugs`);
    return { ...audit, reuploaded };
  } catch (err) {
    log(`audit failed: ${err instanceof Error ? err.message : String(err)}`);
    return {
      totalPublished: 0,
      mirroredOk: 0,
      missing: [],
      cdnHost: SITE.bunny.pullZone,
      checkedAt: new Date().toISOString(),
      durationMs: 0,
      reuploaded: [],
    };
  }
}

/** Build the public CDN URL for one slug. Re-export for the diagnostics route. */
export function publicArticleJsonUrl(slug: string): string {
  return articleJsonUrl(slug);
}
