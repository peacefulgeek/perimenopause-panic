// In-place ASIN swap for server/lib/{herbs,affiliate}.ts.
// We deliberately do not parse the file — just regex over `asin: "..."` lines
// so the rest of each entry (slug, name, sentences, image) stays byte-identical.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
export const HERBS_PATH = path.join(ROOT, "server", "lib", "herbs.ts");
export const AFFILIATE_PATH = path.join(ROOT, "server", "lib", "affiliate.ts");

// Heuristic extraction of (slug,name,asin,expectKeywords) tuples per file.
// Each entry is a `{` block in the array; we read the slug/name/asin and
// compute keywords from the name (lowercase, words >= 4 chars).
function extractEntries(filePath, source) {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf8");
  const entries = [];
  // crude block scanner: split on lines that look like the start of an entry
  // (a line with just `{` after a comma or `[`)
  const blockRe = /\{([^{}]*)\}/g;
  let m;
  while ((m = blockRe.exec(text)) !== null) {
    const block = m[1];
    const slug = block.match(/slug:\s*"([^"]+)"/)?.[1] ?? null;
    const name = block.match(/name:\s*"([^"]+)"/)?.[1] ?? null;
    const asin = block.match(/asin:\s*"([^"]+)"/)?.[1] ?? null;
    if (!asin) continue;
    if (!name && !slug) continue;
    const expectKeywords = computeKeywords(source, slug, name);
    entries.push({ source, slug, name, asin, expectKeywords });
  }
  return entries;
}

function computeKeywords(source, slug, name) {
  const out = new Set();
  const norm = (s) => (s || "").toLowerCase().replace(/[()\/]/g, " ").replace(/\s+/g, " ").trim();
  const n = norm(name);
  const s = norm((slug || "").replace(/-/g, " "));
  for (const w of n.split(" ")) if (w.length >= 4) out.add(w);
  for (const w of s.split(" ")) if (w.length >= 4) out.add(w);
  // Manual aliases (latin <-> common)
  const aliases = {
    "ashwagandha": ["withania"],
    "rhodiola": ["rhodiola"],
    "schisandra": ["schisandra"],
    "eleuthero": ["siberian"],
    "holy": ["tulsi", "ocimum"],
    "tulsi": ["holy", "ocimum"],
    "vitex": ["chasteberry", "chaste"],
    "chasteberry": ["vitex"],
    "epimedium": ["horny goat", "yin yang huo"],
    "horny": ["epimedium"],
    "shou": ["polygonum", "fo-ti", "foti"],
    "rehmannia": ["rehmannia"],
    "ginkgo": ["ginkgo"],
    "kola": ["centella"],
    "centella": ["gotu kola"],
    "raspberry": ["raspberry leaf"],
    "burdock": ["arctium"],
    "linden": ["tilia"],
    "lemon": ["melissa"],
    "melissa": ["lemon balm"],
    "passion": ["passiflora"],
    "passionflower": ["passiflora"],
    "valerian": ["valeriana"],
    "skullcap": ["scutellaria"],
    "shepherds": ["capsella"],
    "yarrow": ["achillea"],
    "magnolia": ["magnolia"],
    "haritaki": ["terminalia"],
    "amla": ["amalaki", "emblica"],
    "amalaki": ["amla", "emblica"],
    "guduchi": ["tinospora"],
    "tribulus": ["tribulus"],
    "ginseng": ["panax", "ginseng"],
    "maca": ["lepidium"],
    "cordyceps": ["cordyceps"],
    "lion": ["hericium", "lion's mane"],
    "reishi": ["ganoderma"],
    "turkey": ["trametes", "turkey tail"],
    "chaga": ["inonotus"],
    "jiaogulan": ["gynostemma"],
    "codonopsis": ["dang shen"],
    "astragalus": ["astragalus"],
    "polygala": ["yuan zhi"],
    "cyperus": ["xiang fu"],
    "ziziphus": ["jujube", "suan zao ren"],
    "deer": ["antler"],
    "frankincense": ["boswellia"],
    "geranium": ["pelargonium"],
    "myo-inositol": ["inositol"],
    "myo": ["inositol"],
    "berberine": ["berberine"],
    "saffron": ["crocus sativus", "saffron"],
    "iodine": ["iodine"],
    "iron": ["iron"],
    "selenium": ["selenium"],
    "boron": ["boron"],
    "chromium": ["chromium"],
    "copper": ["copper"],
    "potassium": ["potassium"],
    "zinc": ["zinc"],
    "vitamin": ["vitamin"],
    "tocotrienol": ["tocotrienol", "tocopherol"],
    "methylcobalamin": ["b12", "b-12"],
    "b-complex": ["b complex", "b-complex"],
    "taurine": ["taurine"],
    "glycine": ["glycine"],
    "leucine": ["leucine"],
    "pea": ["pea protein"],
    "melatonin": ["melatonin"],
    "dim": ["diindolylmethane"],
    "indole": ["indole"],
    "calcium": ["calcium"],
    "magnesium": ["magnesium"],
    "primrose": ["evening primrose"],
    "borage": ["borage"],
    "blackcurrant": ["blackcurrant", "black currant"],
    "omega": ["fish oil", "epa", "dha"],
    "milk": ["milk thistle", "silymarin"],
    "kava": ["kava"],
    "saint": ["st", "wort", "hypericum"],
    "wort": ["hypericum", "st john", "st. john"],
    "lavender": ["lavandula"],
    "chamomile": ["matricaria"],
    "peppermint": ["mentha"],
    "sage": ["salvia"],
    "rose": ["rosa"],
    "hibiscus": ["hibiscus"],
    "californian": ["eschscholzia"],
    "california": ["eschscholzia", "california poppy"],
    "elm": ["slippery elm", "ulmus"],
    "turmeric": ["curcumin"],
    "curcumin": ["turmeric"],
    "yam": ["dioscorea"],
    "poria": ["fu ling"],
    "hawthorn": ["crataegus"],
    "motherwort": ["leonurus"],
    "evening": ["primrose"],
  };
  for (const w of Array.from(out)) {
    for (const a of aliases[w] || []) out.add(a);
  }
  return Array.from(out);
}

export function loadAllEntries() {
  return [
    ...extractEntries(HERBS_PATH, "herbs"),
    ...extractEntries(AFFILIATE_PATH, "catalog"),
  ];
}

export function applySwaps(swaps, opts = { write: true }) {
  // swaps: [{ source: "herbs"|"catalog", oldAsin, newAsin }]
  const groups = { herbs: HERBS_PATH, catalog: AFFILIATE_PATH };
  const reports = [];
  for (const [source, p] of Object.entries(groups)) {
    if (!fs.existsSync(p)) continue;
    let text = fs.readFileSync(p, "utf8");
    let changed = 0;
    for (const s of swaps) {
      if (s.source !== source) continue;
      if (s.oldAsin === s.newAsin) continue;
      const before = text;
      text = text.replace(`asin: "${s.oldAsin}"`, `asin: "${s.newAsin}"`);
      if (text !== before) changed++;
    }
    reports.push({ file: p, changed });
    if (opts.write && changed > 0) fs.writeFileSync(p, text, "utf8");
  }
  return reports;
}
