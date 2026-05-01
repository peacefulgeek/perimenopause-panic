/**
 * Per-site config (master scope §9 says these stay in code, not env, since
 * they're already embedded in the public CDN URLs).
 */
export const SITE = {
  name: "Perimenopause Panic",
  tagline:
    "The honest, non-patronizing guide to perimenopause that starts in your late 30s.",
  description:
    "Evidence-based, warm, and clear writing on the hormonal decade nobody warned you about.",
  apex: "perimenopausepanic.com",
  apexUrl: "https://perimenopausepanic.com",
  authorName: "The Oracle Lover" as const,
  authorSite: "https://theoraclelover.com",
  authorTitle: "The Oracle Lover — Intuitive Educator & Oracle Guide",
  amazonTag: "spankyspinola-20",
  bunny: {
    storageZone: "perimenopause-panic",
    apiKey: "f6dbc11c-20dc-4c15-a39faabe3d28-a766-4a87",
    pullZone: "https://perimenopause-panic.b-cdn.net",
    hostname: "ny.storage.bunnycdn.com",
  },
};

export function publicBaseUrl(): string {
  // In production we always emit canonical URLs at the apex. In dev we use
  // localhost so previews still work.
  if (process.env.NODE_ENV === "production") return SITE.apexUrl;
  return process.env.PUBLIC_BASE_URL || SITE.apexUrl;
}

export function bunnyImageFor(slug: string): string {
  return `${SITE.bunny.pullZone}/images/${slug}.webp`;
}

/**
 * Until the actual Bunny pull zone has been provisioned and the lib-XX.webp
 * files have been uploaded, we fall back to a cycle of editorial images
 * hosted on the WebDev asset CDN. The deterministic mapping by slug index
 * means the assignment is stable across restarts. Once Bunny is live, set
 * USE_BUNNY_LIBRARY=true in env (or just upload library files at the URLs
 * above) and the cron will copy from the library to /images/{slug}.webp.
 */
const FALLBACK_LIBRARY: string[] = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-01-99bwCwCE44RVvsBivjim3v.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-02-57RrBTCHs4zKmEUB5Pavkj.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-03-MJEP4ECfkQ5dNrDPB74Grt.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-04-ZuM76inGb8KrryPLLsh3RZ.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-05-CqhCNRVWwtnkaMphUJXJeW.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-06-FV6UUTGTFu7m4ntohJsSuS.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-07-dGfCAFFDj6gFd3eSf7oFwz.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-08-A9tRX4gTCsQuqxqGjStKoC.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-09-kdcwoUNtSqs2yEAudDMTvq.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663309220512/giES5D3NCtGvLGR7vYz5rT/lib-10-4Gadiv3EDwjyvkgzDCfYzP.webp",
];

export function bunnyLibraryImage(idx: number): string {
  const useBunny = (process.env.USE_BUNNY_LIBRARY || "false").toLowerCase() === "true";
  if (useBunny) {
    const padded = String(((idx - 1) % 40) + 1).padStart(2, "0");
    return `${SITE.bunny.pullZone}/library/lib-${padded}.webp`;
  }
  return FALLBACK_LIBRARY[(idx - 1 + FALLBACK_LIBRARY.length) % FALLBACK_LIBRARY.length];
}
