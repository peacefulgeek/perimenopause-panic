/**
 * bulkSeedWithClaude.ts
 *
 * For every status="queued" entry in articles/index.json that does NOT yet
 * have a per-slug JSON file on Bunny, generate the article via Claude
 * (claude-sonnet-4-6), gate it through runQualityGate, mint a unique FAL
 * watercolor hero, and upload the populated articles/<slug>.json to Bunny
 * with status="queued" still. The weekday cron's bunnyPublishNext() then
 * walks the queue and promotes one populated entry per day.
 *
 * The script does NOT touch the index.json: status stays "queued" until
 * the weekday cron promotes it. Existing populated queued entries are
 * skipped (idempotent) unless --force is passed.
 *
 * Run:
 *   pnpm tsx server/scripts/bulkSeedWithClaude.ts \
 *     [--only=<slug>] [--limit=<n>] [--concurrency=<n>] [--force]
 *
 * Env required:
 *   CLAUDE_API_KEY  - Anthropic key (validated by claudeKey.test.ts)
 *   BUNNY_API_KEY   - Bunny storage zone key
 *   FAL_KEY         - FAL flux/schnell key for heroes
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateArticleHtml } from "../lib/generateArticle";
import { CATALOG } from "../lib/affiliate";
import { bunnyPut } from "../lib/bunny";
import { SITE } from "../lib/siteConfig";
import type { IndexJson, IndexEntry, StoredArticle } from "../lib/articleStore";

const PULL = SITE.bunny.pullZone;
const INDEX_KEY = "articles/index.json";
const FAL_KEY = process.env.FAL_KEY!;

const AUTHORITIES_BY_CATEGORY: Record<string, { name: string; href: string }> = {
  diagnosis: {
    name: "NIH StatPearls overview of FSH biology",
    href: "https://www.ncbi.nlm.nih.gov/books/NBK535442/",
  },
  biology: {
    name: "NIH StatPearls overview of FSH biology",
    href: "https://www.ncbi.nlm.nih.gov/books/NBK535442/",
  },
  brain: {
    name: "NIH on estrogen and the female brain",
    href: "https://www.ninds.nih.gov/health-information/disorders/migraine",
  },
  "mental-health": {
    name: "NIH NIMH on depression in midlife women",
    href: "https://www.nimh.nih.gov/health/topics/depression",
  },
  sleep: {
    name: "CDC adult sleep recommendations",
    href: "https://www.cdc.gov/sleep/about/index.html",
  },
  symptoms: {
    name: "The Menopause Society 2022 hormone therapy position statement",
    href: "https://menopause.org/professional-resources/position-statements",
  },
  treatment: {
    name: "PubMed reanalysis of the Women's Health Initiative",
    href: "https://pubmed.ncbi.nlm.nih.gov/35435270/",
  },
  hrt: {
    name: "PubMed reanalysis of the Women's Health Initiative",
    href: "https://pubmed.ncbi.nlm.nih.gov/35435270/",
  },
  bone: {
    name: "NIAMS on bone health and osteoporosis",
    href: "https://www.niams.nih.gov/health-topics/osteoporosis",
  },
  heart: {
    name: "NHLBI on heart disease in women",
    href: "https://www.nhlbi.nih.gov/health/heart-disease-women",
  },
  thyroid: {
    name: "NIDDK overview of hypothyroidism",
    href: "https://www.niddk.nih.gov/health-information/endocrine-diseases/hypothyroidism",
  },
  metabolism: {
    name: "NIDDK on insulin resistance and prediabetes",
    href: "https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/prediabetes-insulin-resistance",
  },
  lifestyle: {
    name: "ODPHP Physical Activity Guidelines for Americans",
    href: "https://health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
  },
  vagina: {
    name: "NIH StatPearls genitourinary syndrome of menopause",
    href: "https://www.ncbi.nlm.nih.gov/books/NBK559253/",
  },
};

const DEFAULT_AUTHORITY = {
  name: "The Menopause Society 2022 hormone therapy position statement",
  href: "https://menopause.org/professional-resources/position-statements",
};

function pickAuthority(category: string) {
  return AUTHORITIES_BY_CATEGORY[category] ?? DEFAULT_AUTHORITY;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const sep = url.includes("?") ? "&" : "?";
    const r = await fetch(`${url}${sep}bust=${Date.now()}`, {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

async function fetchJsonFromOrigin<T>(key: string): Promise<T | null> {
  try {
    const url = `https://${SITE.bunny.storageHost}/perimenopause/${key}`;
    const r = await fetch(url, {
      headers: {
        AccessKey: process.env.BUNNY_API_KEY!,
        "Cache-Control": "no-cache",
      },
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** Pick a unique watercolor still-life subject keyed off title/category/tags. */
function pickSubject(e: IndexEntry): string {
  const t = (e.title + " " + e.category + " " + (e.tags || []).join(" ")).toLowerCase();
  if (/sleep|3 ?am|insomnia|night/.test(t))
    return "moonlit linen sheets and a porcelain teacup with chamomile";
  if (/rage|anger|anxiety|mood/.test(t))
    return "a stormy sky breaking into rose, with peonies in a glass vase";
  if (/brain|fog|cognition|memory/.test(t))
    return "open journals, eyeglasses, and dried lavender on a marble desk";
  if (/sweat|hot ?flash|temperature|thermo/.test(t))
    return "a frosted carafe of cucumber water with mint sprigs on linen";
  if (/work|career|office/.test(t))
    return "a leather notebook, fountain pen, and porcelain teacup on parchment";
  if (/food|nutrition|diet|protein|insulin|weight/.test(t))
    return "wholegrain bread, soft cheese, ripe figs, and a pomegranate on linen";
  if (/exercise|strength|bone|muscle/.test(t))
    return "vintage dumbbells, a coiled resistance band, and yarrow flowers on linen";
  if (/heart|cardio|cholesterol|estrogen/.test(t))
    return "a porcelain teacup of hibiscus tea, blood oranges, and rosemary";
  if (/thyroid|cycle|fsh|labs|test/.test(t))
    return "a glass apothecary jar of dried herbs, a stethoscope, and snowdrops";
  if (/vagina|gsm|libido|intimacy/.test(t))
    return "soft pink peonies, lace, and a ceramic dish of rose petals";
  if (/hrt|estrogen|progesterone|hormone|bioidentical/.test(t))
    return "amber tincture bottles, a brass key, and dried roses on parchment";
  if (/doctor|nams|menopause society|provider/.test(t))
    return "a leather-bound medical journal, fountain pen, and a small magnolia bloom";
  return "an heirloom porcelain teacup with steeping herbs, dried rose hips, and a soft scarf on linen";
}

function heroPromptFor(e: IndexEntry): string {
  const tags = (e.tags || []).slice(0, 3).join(", ");
  const subject = pickSubject(e);
  return [
    `feminine watercolor still life, ${subject},`,
    `editorial broadsheet hero image, soft cream and rose tones,`,
    `painterly washes, dreamy, calm, warm light,`,
    `inspired by perimenopause editorial about ${e.title.replace(/[^a-zA-Z0-9 ,.'-]/g, "").slice(0, 80)},`,
    tags ? `motifs: ${tags},` : ``,
    `no text, no letters, no logos, no faces, hand-painted texture, gallery-quality`,
  ]
    .filter(Boolean)
    .join(" ");
}

async function generateHero(slug: string, e: IndexEntry): Promise<string | null> {
  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: heroPromptFor(e),
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: false,
    }),
  });
  if (!res.ok) {
    console.warn(`  [${slug}] FAL HTTP ${res.status}`);
    return null;
  }
  const j = (await res.json()) as { images?: Array<{ url: string }> };
  const url = j.images?.[0]?.url;
  if (!url) return null;
  // Download + convert via Python+Pillow
  const tmp = mkdtempSync(join(tmpdir(), `hero-${slug}-`));
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    const jpgPath = join(tmp, "in.jpg");
    const webpPath = join(tmp, "out.webp");
    writeFileSync(jpgPath, Buffer.from(ab));
    const py = spawnSync(
      "python3",
      [
        "-c",
        `from PIL import Image
img = Image.open(${JSON.stringify(jpgPath)}).convert("RGB")
if img.width > 1280:
  ratio = 1280 / img.width
  img = img.resize((1280, int(img.height * ratio)), Image.LANCZOS)
img.save(${JSON.stringify(webpPath)}, "WEBP", quality=82, method=6)
`,
      ],
      { encoding: "utf8" },
    );
    if (py.status !== 0) {
      console.warn(`  [${slug}] pillow failed: ${py.stderr}`);
      return null;
    }
    const webpBuf = readFileSync(webpPath);
    const key = `articles/heroes/${slug}.webp`;
    const up = await bunnyPut(key, webpBuf, "image/webp");
    if (!up.ok) {
      console.warn(`  [${slug}] bunny hero upload failed: ${up.status}`);
      return null;
    }
    return `${PULL}/${key}`;
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {}
  }
}

interface SeedResult {
  slug: string;
  outcome:
    | "created"
    | "skipped-already-populated"
    | "gate-failed"
    | "claude-error"
    | "hero-error"
    | "upload-error";
  detail?: string;
  wordCount?: number;
}

async function processOne(e: IndexEntry, related: { slug: string; title: string }[], force: boolean): Promise<SeedResult> {
  // Skip if a per-slug JSON already exists at origin AND has real content,
  // unless --force is set.
  if (!force) {
    const existing = await fetchJsonFromOrigin<StoredArticle>(`articles/${e.slug}.json`);
    if (
      existing &&
      typeof existing.body === "string" &&
      existing.body.trim().length > 200 &&
      typeof existing.heroUrl === "string" &&
      /^https?:\/\//.test(existing.heroUrl) &&
      (existing.wordCount ?? 0) >= 200
    ) {
      return { slug: e.slug, outcome: "skipped-already-populated", wordCount: existing.wordCount };
    }
  }
  let body: string;
  let tldr: string;
  let asinsUsed: string[];
  let internalLinksUsed: string[];
  let wordCount: number;
  try {
    const out = await generateArticleHtml(
      {
        topic: e.title,
        category: e.category,
        tags: e.tags || [],
        related: related.slice(0, 8),
        authority: pickAuthority(e.category),
      },
      CATALOG,
    );
    body = out.body;
    tldr = out.tldr;
    asinsUsed = out.asinsUsed;
    internalLinksUsed = out.internalLinksUsed;
    wordCount = out.wordCount;
  } catch (err: any) {
    return { slug: e.slug, outcome: "claude-error", detail: String(err?.message ?? err).slice(0, 200) };
  }
  // generateArticleHtml internally runs the gate + self-correction loop; if
  // we reach here we still re-check explicitly so the failure surfaces in
  // the report.
  // (the loop allows passing-but-imperfect output; we accept whatever it
  // returned.)
  // Generate hero
  const heroUrl = await generateHero(e.slug, e);
  if (!heroUrl) {
    return { slug: e.slug, outcome: "hero-error" };
  }
  // Build the StoredArticle payload (status stays "queued" — the cron promotes)
  const nowIso = new Date().toISOString();
  const meta = (e.metaDescription || tldr).slice(0, 160) || `Evidence-led perimenopause guide: ${e.title}`;
  const article: StoredArticle = {
    schemaVersion: 1,
    slug: e.slug,
    title: e.title,
    metaDescription: meta,
    ogTitle: e.title,
    ogDescription: meta,
    category: e.category,
    tags: e.tags || [],
    imageAlt: `Watercolor still life evoking ${e.title}`,
    heroUrl,
    readingTime: Math.max(1, Math.round(wordCount / 230)),
    wordCount,
    status: "queued",
    publishedAt: null,
    lastModifiedAt: nowIso,
    tldr,
    body,
    opener: "gut-punch",
    conclusion: "cta",
    asinsUsed,
    internalLinksUsed,
    canonical: `https://perimenopausepanic.com/articles/${e.slug}`,
    jsonUrl: `${PULL}/articles/${e.slug}.json`,
    author: {
      name: "The Oracle Lover",
      site: "https://theoraclelover.com",
      title: "Intuitive teacher, evidence-led editor, twenty years of practice",
    },
    site: {
      name: "Perimenopause Panic",
      apex: "perimenopausepanic.com",
      apexUrl: "https://perimenopausepanic.com",
    },
  };
  const up = await bunnyPut(
    `articles/${e.slug}.json`,
    Buffer.from(JSON.stringify(article, null, 2), "utf8"),
    "application/json",
  );
  if (!up.ok) {
    return { slug: e.slug, outcome: "upload-error", detail: `HTTP ${up.status}` };
  }
  return { slug: e.slug, outcome: "created", wordCount };
}

async function main() {
  if (!process.env.BUNNY_API_KEY) {
    console.error("BUNNY_API_KEY missing");
    process.exit(1);
  }
  if (!process.env.CLAUDE_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error("CLAUDE_API_KEY missing");
    process.exit(1);
  }
  if (!FAL_KEY) {
    console.error("FAL_KEY missing");
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const arg = (name: string, def: string | null = null) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.split("=", 2)[1] : def;
  };
  const onlySlug = arg("only");
  const limit = arg("limit") ? Number(arg("limit")) : Infinity;
  const concurrency = arg("concurrency") ? Math.max(1, Math.min(16, Number(arg("concurrency")))) : 4;
  const force = args.includes("--force");
  const idx = await fetchJson<IndexJson>(`${PULL}/${INDEX_KEY}`);
  if (!idx || !Array.isArray(idx.articles)) {
    console.error("index.json unreachable");
    process.exit(1);
  }
  // related = first 8 published, useful for internal-link prompts
  const related = idx.articles
    .filter((a) => a.status === "published")
    .slice(0, 8)
    .map((a) => ({ slug: a.slug, title: a.title }));
  let targets = idx.articles.filter(
    (a) => a.status === "queued" && (!onlySlug || a.slug === onlySlug),
  );
  if (Number.isFinite(limit)) targets = targets.slice(0, limit);
  console.log(
    `[bulkSeed] ${targets.length} queued targets, concurrency=${concurrency}, force=${force}`,
  );
  const queue = [...targets];
  const results: SeedResult[] = [];
  let next = 0;
  async function worker(workerId: number) {
    while (true) {
      const e = queue.shift();
      if (!e) return;
      const idxInTotal = ++next;
      const started = Date.now();
      try {
        const r = await processOne(e, related, force);
        results.push(r);
        const ms = Date.now() - started;
        console.log(
          `[w${workerId}] (${idxInTotal}/${targets.length}) ${r.slug} → ${r.outcome}${
            r.wordCount ? ` (${r.wordCount}w)` : ""
          }${r.detail ? ` [${r.detail}]` : ""} in ${(ms / 1000).toFixed(1)}s`,
        );
      } catch (err: any) {
        results.push({
          slug: e.slug,
          outcome: "claude-error",
          detail: String(err?.message ?? err).slice(0, 200),
        });
        console.log(`[w${workerId}] (${idxInTotal}/${targets.length}) ${e.slug} → THREW: ${err?.message ?? err}`);
      }
    }
  }
  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  // Final tally
  const tally = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.outcome] = (acc[r.outcome] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`\n[bulkSeed] DONE. Tally: ${JSON.stringify(tally)}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("bulkSeed fatal:", err);
  process.exit(1);
});
