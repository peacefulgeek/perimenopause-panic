import { SITE, bunnyImageFor, bunnyLibraryImage } from "./siteConfig";

/**
 * Master scope §9A — pick a random library image, copy it to /images/{slug}.webp,
 * return the public URL. Falls back to the library URL itself if the copy fails.
 * The library is seeded externally with 40 WebP files at /library/lib-01..40.webp.
 */
export async function assignHeroImage(slug: string): Promise<string> {
  const idx = Math.floor(Math.random() * 40) + 1;
  const sourceUrl = bunnyLibraryImage(idx);
  const destUrl = bunnyImageFor(slug);

  try {
    const downloadRes = await fetch(sourceUrl);
    if (!downloadRes.ok) throw new Error(`download ${downloadRes.status}`);
    const buf = await downloadRes.arrayBuffer();

    const upRes = await fetch(
      `https://${SITE.bunny.hostname}/${SITE.bunny.storageZone}/images/${slug}.webp`,
      {
        method: "PUT",
        headers: {
          AccessKey: SITE.bunny.apiKey,
          "Content-Type": "image/webp",
        },
        body: Buffer.from(buf),
      },
    );
    if (!upRes.ok) throw new Error(`upload ${upRes.status}`);
    return destUrl;
  } catch (e) {
    // Hard fallback: cycle through library URLs deterministically by slug.
    const fallbackIdx =
      (Array.from(slug).reduce((a, c) => a + c.charCodeAt(0), 0) % 40) + 1;
    return bunnyLibraryImage(fallbackIdx);
  }
}

export function deterministicHeroFor(slug: string): string {
  const idx =
    (Array.from(slug).reduce((a, c) => a + c.charCodeAt(0), 0) % 40) + 1;
  return bunnyLibraryImage(idx);
}
