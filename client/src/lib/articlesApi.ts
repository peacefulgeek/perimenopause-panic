import { useEffect, useState } from "react";

export interface ArticleSummary {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  lastModifiedAt: string;
  metaDescription: string;
  heroUrl: string;
}

export interface ArticleFull extends ArticleSummary {
  ogTitle: string;
  ogDescription: string;
  imageAlt: string;
  readingTime: number;
  author: string;
  status: "queued" | "published";
  wordCount: number;
  asinsUsed: string[];
  internalLinksUsed: string[];
  body: string;
  tldr: string;
  opener: string;
  conclusion: string;
}

/**
 * `useArticles` — list of all published articles.
 * Hardened: aborts on unmount, checks `r.ok`, normalizes the payload to an
 * array, never leaves the caller stuck in "loading" if the request fails.
 */
export function useArticles() {
  const [data, setData] = useState<ArticleSummary[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    fetch("/api/articles", { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`articles-list-${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setData(Array.isArray(d) ? (d as ArticleSummary[]) : []);
      })
      .catch((e: unknown) => {
        if (cancelled || (e as { name?: string })?.name === "AbortError") return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setData([]); // unblock UI: empty list instead of perpetual spinner
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, []);
  return { data, error, loading: data === null && error === null };
}

/**
 * `useArticle` — single published article by slug.
 * Hardened: resets state when `slug` changes, aborts in-flight requests on
 * change/unmount, treats missing slug as not-loading, never throws into render.
 */
export function useArticle(slug: string | undefined) {
  const [data, setData] = useState<ArticleFull | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(!!slug);
  useEffect(() => {
    if (!slug) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    // Reset prior state so a stale article doesn't flash while loading the new one.
    setData(null);
    setError(null);
    setLoading(true);
    const ctrl = new AbortController();
    let cancelled = false;
    fetch(`/api/articles/${slug}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "not-found" : `article-${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setData(d as ArticleFull);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled || (e as { name?: string })?.name === "AbortError") return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setLoading(false);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [slug]);
  return { data, error, loading };
}
