import { SITE, bunnyArticleHero, bunnyLibraryImage } from "./siteConfig";

/**
 * Bunny storage credentials. The pull-zone host is public and lives in
 * code; the storage API key is private. We read it from BUNNY_API_KEY,
 * which is loaded at boot from /home/ubuntu/.bunny-perimenopause if
 * present so the dev sandbox works out of the box, and from the platform
 * env in production. NEVER print the key.
 */
function bunnyApiKey(): string {
  return process.env.BUNNY_API_KEY || "";
}

const STORAGE_BASE = `https://${SITE.bunny.storageHost}/${SITE.bunny.storageZone}`;

export async function bunnyPut(
  path: string,
  body: Buffer | ArrayBuffer | Uint8Array,
  contentType = "image/webp",
): Promise<{ ok: boolean; status: number; url: string }> {
  const key = bunnyApiKey();
  const url = `${STORAGE_BASE}/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: key,
      "Content-Type": contentType,
    },
    body: body instanceof Buffer ? body : Buffer.from(body as ArrayBuffer),
  });
  return {
    ok: res.ok,
    status: res.status,
    url: `${SITE.bunny.pullZone}/${path}`,
  };
}

export async function bunnyExists(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${SITE.bunny.pullZone}/${path}`, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Pick a watercolor library image and copy it to /articles/{slug}.webp.
 * Falls back to the library URL itself if the copy fails — every URL is a
 * Bunny URL either way, so the page always shows a real image.
 */
export async function assignHeroImage(slug: string): Promise<string> {
  const fallback = deterministicHeroFor(slug);
  if (!bunnyApiKey()) return fallback; // no creds yet → just point at library URL

  try {
    const sourceUrl = fallback;
    const downloadRes = await fetch(sourceUrl);
    if (!downloadRes.ok) return fallback;
    const buf = await downloadRes.arrayBuffer();
    const up = await bunnyPut(`articles/${slug}.webp`, buf);
    return up.ok ? up.url : fallback;
  } catch {
    return fallback;
  }
}

/** Deterministic hero from the 40-image library, by slug hash. */
export function deterministicHeroFor(slug: string): string {
  const idx =
    (Array.from(slug).reduce((a, c) => a + c.charCodeAt(0), 0) % 40) + 1;
  return bunnyLibraryImage(idx);
}

export { bunnyArticleHero };
