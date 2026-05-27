/**
 * generateUniqueHeroes.ts
 *
 * For every published article on Bunny CDN, generate a unique watercolor
 * hero image via FAL (flux/schnell), convert to WebP via Pillow CLI,
 * upload to Bunny at articles/heroes/<slug>.webp, then update the article
 * JSON so its heroUrl points at the new image.
 *
 * Run:
 *   pnpm tsx server/scripts/generateUniqueHeroes.ts [--only=<slug>] [--force]
 *
 * Without --force, the script skips articles whose heroUrl already points at
 * articles/heroes/<slug>.webp (i.e. they already have a unique hero).
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bunnyPut } from "../lib/bunny";
import { SITE } from "../lib/siteConfig";
import type { IndexJson, StoredArticle } from "../lib/articleStore";

const PULL = SITE.bunny.pullZone;
const INDEX_KEY = "articles/index.json";
const FAL_KEY = process.env.FAL_KEY!;

async function getJson<T>(url: string): Promise<T | null> {
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

/** Build a unique watercolor prompt seeded by the article's tags and category. */
function promptFor(a: StoredArticle): string {
  const tags = (a.tags || []).slice(0, 3).join(", ");
  const subject = pickSubject(a);
  return [
    `feminine watercolor still life, ${subject},`,
    `editorial broadsheet hero image, soft cream and rose tones,`,
    `painterly washes, dreamy, calm, warm light,`,
    `inspired by perimenopause editorial about ${a.title.replace(/[^a-zA-Z0-9 ,.'-]/g, "").slice(0, 80)},`,
    tags ? `motifs: ${tags},` : ``,
    `no text, no letters, no logos, no faces, hand-painted texture, gallery-quality`,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Pick a different visual subject per article so we get visual variety.
 * Each subject is a still-life that maps to the topic without showing people.
 */
function pickSubject(a: StoredArticle): string {
  const t = (a.title + " " + a.category + " " + (a.tags || []).join(" ")).toLowerCase();
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
  // Default
  return "an heirloom porcelain teacup with steeping herbs, dried rose hips, and a soft scarf on linen";
}

async function generateImage(prompt: string): Promise<string | null> {
  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: false,
    }),
  });
  if (!res.ok) {
    console.warn(`  FAL HTTP ${res.status}`);
    return null;
  }
  const j = (await res.json()) as { images?: Array<{ url: string }> };
  return j.images?.[0]?.url ?? null;
}

async function downloadAndConvert(jpgUrl: string, slug: string): Promise<Buffer | null> {
  const tmp = mkdtempSync(join(tmpdir(), `hero-${slug}-`));
  try {
    const r = await fetch(jpgUrl);
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    const jpgPath = join(tmp, "in.jpg");
    const webpPath = join(tmp, "out.webp");
    writeFileSync(jpgPath, Buffer.from(ab));
    // Convert via Python+Pillow (already installed)
    const py = spawnSync(
      "python3",
      [
        "-c",
        `from PIL import Image
img = Image.open(${JSON.stringify(jpgPath)}).convert("RGB")
# resize for web while preserving aspect
if img.width > 1280:
  ratio = 1280 / img.width
  img = img.resize((1280, int(img.height * ratio)), Image.LANCZOS)
img.save(${JSON.stringify(webpPath)}, "WEBP", quality=82, method=6)
`,
      ],
      { encoding: "utf8" },
    );
    if (py.status !== 0) {
      console.warn(`  pillow failed: ${py.stderr}`);
      return null;
    }
    return readFileSync(webpPath);
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {}
  }
}

async function main() {
  if (!process.env.BUNNY_API_KEY) {
    console.error("BUNNY_API_KEY missing");
    process.exit(1);
  }
  if (!FAL_KEY) {
    console.error("FAL_KEY missing");
    process.exit(1);
  }
  const argOnly = process.argv.find((s) => s.startsWith("--only="));
  const onlySlug = argOnly ? argOnly.split("=")[1] : null;
  const force = process.argv.includes("--force");

  const idx = await getJson<IndexJson>(`${PULL}/${INDEX_KEY}`);
  if (!idx || !Array.isArray(idx.articles)) {
    console.error("index.json unreachable");
    process.exit(1);
  }
  const targets = idx.articles.filter(
    (a) => a.status === "published" && (!onlySlug || a.slug === onlySlug),
  );
  console.log(`generating unique heroes for ${targets.length} articles…`);

  let ok = 0, skip = 0, fail = 0;

  async function processOne(e: typeof targets[number]) {
    const a = await getJson<StoredArticle>(`${PULL}/articles/${e.slug}.json`);
    if (!a) { fail++; return; }
    const expectedKey = `articles/heroes/${e.slug}.webp`;
    const expectedUrl = `${PULL}/${expectedKey}`;
    if (!force && a.heroUrl === expectedUrl) {
      console.log(`  ${e.slug}: already has unique hero, skip`);
      skip++; return;
    }
    if (!a.body || a.body.trim().length < 200) {
      console.log(`  ${e.slug}: placeholder body, skip`);
      skip++; return;
    }
    const prompt = promptFor(a);
    console.log(`  ${e.slug}: generating…`);
    let attempts = 0;
    let bytes: Buffer | null = null;
    while (attempts < 3 && !bytes) {
      attempts++;
      const jpgUrl = await generateImage(prompt);
      if (!jpgUrl) { await new Promise((r) => setTimeout(r, 1500 * attempts)); continue; }
      bytes = await downloadAndConvert(jpgUrl, e.slug);
      if (!bytes) { await new Promise((r) => setTimeout(r, 1500 * attempts)); }
    }
    if (!bytes) { console.log(`  ${e.slug}: FAILED hero gen`); fail++; return; }
    const up = await bunnyPut(expectedKey, bytes, "image/webp");
    if (!up.ok) { console.log(`  ${e.slug}: bunny upload failed ${up.status}`); fail++; return; }
    const updated: StoredArticle = { ...a, heroUrl: expectedUrl, lastModifiedAt: new Date().toISOString() };
    const upJ = await bunnyPut(
      `articles/${e.slug}.json`,
      Buffer.from(JSON.stringify(updated, null, 2), "utf8"),
      "application/json",
    );
    console.log(`  ${e.slug}: hero=${expectedKey} (${(bytes.length / 1024).toFixed(0)} KB) json=${upJ.status}`);
    if (up.ok && upJ.ok) ok++; else fail++;
  }

  // 4-way parallel
  const queue = [...targets];
  async function worker() {
    while (queue.length) {
      const e = queue.shift();
      if (!e) return;
      try { await processOne(e); } catch (err) {
        console.warn(`  ${e.slug}: worker error:`, (err as Error).message);
        fail++;
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, () => worker()));

  console.log(`\ndone. ok=${ok}  skipped=${skip}  failed=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
