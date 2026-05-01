/**
 * Per-site config. The Bunny pull zone is the single source of truth for
 * imagery. Once images are uploaded to the storage zone, every URL on the
 * site resolves through Bunny — no Manus runtime, no Manus storage, no
 * Manus CDN, no fallbacks.
 */
export const SITE = {
  name: "Perimenopause Panic",
  tagline:
    "The honest, non-patronizing guide to perimenopause that starts in your late 30s.",
  description:
    "Soft, evidence-led writing for the hormonal decade nobody warned you about. Watercolor heart, scientific spine.",
  apex: "perimenopausepanic.com",
  apexUrl: "https://perimenopausepanic.com",
  authorName: "The Oracle Lover" as const,
  authorSite: "https://theoraclelover.com",
  authorTitle: "The Oracle Lover — Intuitive Educator & Oracle Guide",
  amazonTag: "spankyspinola-20",
  bunny: {
    storageZone: "perimenopause",
    pullZone: "https://perimenopause.b-cdn.net",
    storageHost: "ny.storage.bunnycdn.com",
  },
};

export function publicBaseUrl(): string {
  if (process.env.NODE_ENV === "production") return SITE.apexUrl;
  return process.env.PUBLIC_BASE_URL || SITE.apexUrl;
}

/** Page-hero watercolor by name (home, articles, herbs, assessments, tools, about). */
export function bunnyPageHero(name: string): string {
  return `${SITE.bunny.pullZone}/heroes/hero-${name}.webp`;
}

/** Article hero for a slug. */
export function bunnyArticleHero(slug: string): string {
  return `${SITE.bunny.pullZone}/articles/${slug}.webp`;
}

/** A reusable site-library watercolor by 1-indexed number (01..40). */
export function bunnyLibraryImage(idx: number): string {
  const padded = String(((idx - 1 + 40) % 40) + 1).padStart(2, "0");
  return `${SITE.bunny.pullZone}/library/lib-${padded}.webp`;
}

/** Watercolor thumbnail for an herb/supplement key. */
export function bunnyHerbImage(key: string): string {
  return `${SITE.bunny.pullZone}/herbs/${key}.webp`;
}

/** Watercolor thumbnail for an assessment key. */
export function bunnyAssessmentImage(key: string): string {
  return `${SITE.bunny.pullZone}/assessments/${key}.webp`;
}

/** WOFF2 font url. */
export function bunnyFont(file: string): string {
  return `${SITE.bunny.pullZone}/fonts/${file}`;
}
