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

export function useArticles() {
  const [data, setData] = useState<ArticleSummary[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch((e) => setError(e));
  }, []);
  return { data, error, loading: data === null && error === null };
}

export function useArticle(slug: string | undefined) {
  const [data, setData] = useState<ArticleFull | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/articles/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not-found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e);
        setLoading(false);
      });
  }, [slug]);
  return { data, error, loading };
}
