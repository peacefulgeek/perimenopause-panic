import { SITE } from "./siteConfig";

export interface Product {
  asin: string;
  name: string;
  category: string; // books | supplements | sleep | testing | exercise | vaginal-health
  tags: string[];
}

/**
 * Niche-relevant Amazon products. ASINs are well-known long-running titles
 * for the perimenopause niche; the ASIN health check cron resolves any
 * stragglers at runtime. Tag is always spankyspinola-20.
 */
export const CATALOG: Product[] = [
  // Books
  {
    asin: "0806541490",
    name: "The Menopause Manifesto by Jen Gunter MD",
    category: "books",
    tags: ["evidence", "menopause", "hrt", "doctor", "advocacy"],
  },
  {
    asin: "0593713230",
    name: "The New Menopause by Mary Claire Haver MD",
    category: "books",
    tags: ["metabolism", "weight", "perimenopause", "hrt", "diet"],
  },
  {
    asin: "059318395X",
    name: "The Menopause Brain by Lisa Mosconi PhD",
    category: "books",
    tags: ["brain", "estrogen", "neurology", "cognition", "fog"],
  },
  {
    asin: "0316481211",
    name: "Estrogen Matters by Avrum Bluming MD and Carol Tavris PhD",
    category: "books",
    tags: ["hrt", "evidence", "whi", "estrogen"],
  },
  {
    asin: "1623367298",
    name: "ROAR by Stacy Sims PhD",
    category: "books",
    tags: ["exercise", "strength", "physiology", "training"],
  },
  // Supplements (educational; consult provider)
  {
    asin: "B0019LRY8A",
    name: "Pure Encapsulations Magnesium Glycinate",
    category: "supplements",
    tags: ["sleep", "anxiety", "magnesium", "muscle"],
  },
  {
    asin: "B00CAZAU62",
    name: "Nordic Naturals Ultimate Omega High-EPA",
    category: "supplements",
    tags: ["mood", "inflammation", "heart", "brain", "omega-3"],
  },
  {
    asin: "B00JGCBGZQ",
    name: "Thorne Vitamin D plus K2 Liquid",
    category: "supplements",
    tags: ["bone", "vitamin-d", "k2"],
  },
  {
    asin: "B07H8QMZWV",
    name: "NOW Foods Evening Primrose Oil 1000 mg",
    category: "supplements",
    tags: ["skin", "cycle", "epo"],
  },
  // Sleep
  {
    asin: "B07FDJMC9Q",
    name: "Hatch Restore 2 Sound Machine and Sunrise Alarm",
    category: "sleep",
    tags: ["sleep", "wake", "circadian", "anxiety"],
  },
  {
    asin: "B001689RGQ",
    name: "Marpac Yogasleep Dohm Classic White Noise Machine",
    category: "sleep",
    tags: ["sleep", "noise", "settle"],
  },
  {
    asin: "B0BFDR7HF1",
    name: "SlumberCloud Stratus Cooling Sheets Set",
    category: "sleep",
    tags: ["night-sweats", "cooling", "sheets"],
  },
  // Testing
  {
    asin: "B07Z9P2J5L",
    name: "Everlywell Womens Health Test At-Home Kit",
    category: "testing",
    tags: ["hormones", "lab", "fsh", "estradiol"],
  },
  {
    asin: "B07PWZRZ34",
    name: "LetsGetChecked Female Hormone Test",
    category: "testing",
    tags: ["hormones", "lab", "perimenopause"],
  },
  // Exercise
  {
    asin: "B001ARYU58",
    name: "Bowflex SelectTech 552 Adjustable Dumbbells",
    category: "exercise",
    tags: ["strength", "training", "muscle", "bone"],
  },
  {
    asin: "B07P7XNYBC",
    name: "Bodylastics Resistance Bands Set",
    category: "exercise",
    tags: ["strength", "bands", "training", "travel"],
  },
  {
    asin: "B095J38B7C",
    name: "Garmin Venu Sq 2 Fitness Smartwatch",
    category: "exercise",
    tags: ["sleep", "tracking", "heart-rate", "wellness"],
  },
  // Vaginal health
  {
    asin: "B000056VS4",
    name: "Replens Long-Lasting Vaginal Moisturizer",
    category: "vaginal-health",
    tags: ["gsm", "vaginal", "moisturizer"],
  },
  {
    asin: "B07XTL9JHF",
    name: "Revaree Hyaluronic Acid Vaginal Inserts by Bonafide",
    category: "vaginal-health",
    tags: ["gsm", "vaginal", "hyaluronic"],
  },
];

export function matchProducts(opts: {
  title: string;
  category: string;
  tags: string[];
  catalog: Product[];
  minLinks: number;
  maxLinks: number;
}): Product[] {
  const tagSet = new Set(opts.tags.map((t) => t.toLowerCase()));
  const titleLower = opts.title.toLowerCase();
  const scored = opts.catalog.map((p) => {
    let score = 0;
    if (p.category.toLowerCase() === opts.category.toLowerCase()) score += 4;
    for (const t of p.tags) if (tagSet.has(t.toLowerCase())) score += 2;
    for (const t of p.tags) if (titleLower.includes(t.toLowerCase())) score += 2;
    if (titleLower.includes(p.name.toLowerCase())) score += 5;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  // Always include at least one book if available, plus diverse categories
  const picks: Product[] = [];
  const seenCat = new Set<string>();
  for (const { p } of scored) {
    if (picks.length >= opts.maxLinks) break;
    if (!seenCat.has(p.category)) {
      picks.push(p);
      seenCat.add(p.category);
    }
  }
  // Top up if we didn't reach min
  if (picks.length < opts.minLinks) {
    for (const { p } of scored) {
      if (picks.length >= opts.minLinks) break;
      if (!picks.includes(p)) picks.push(p);
    }
  }
  return picks.slice(0, Math.max(opts.minLinks, Math.min(opts.maxLinks, picks.length)));
}

export function amazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${SITE.amazonTag}`;
}
