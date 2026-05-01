import { Link } from "wouter";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { useArticles, type ArticleSummary } from "@/lib/articlesApi";

function fmtDate(s: string | null): string {
  if (!s) return "";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Articles() {
  const { data, loading } = useArticles();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");

  const cats = useMemo(() => {
    const set = new Set<string>(["All"]);
    (data || []).forEach((a) => set.add(a.category));
    return Array.from(set);
  }, [data]);

  const filtered: ArticleSummary[] = useMemo(() => {
    const base = data || [];
    return base.filter((a) => {
      if (cat !== "All" && a.category !== cat) return false;
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        a.title.toLowerCase().includes(needle) ||
        a.metaDescription.toLowerCase().includes(needle) ||
        a.tags.some((t) => t.toLowerCase().includes(needle))
      );
    });
  }, [data, q, cat]);

  return (
    <SiteShell>
      <section className="container pt-10 pb-6">
        <div className="badge-category">Archive</div>
        <h1 className="editorial-serif mt-3">All articles</h1>
        <p className="mt-3 text-[var(--plum-soft)] max-w-2xl">
          Every published piece on Perimenopause Panic. Search by keyword,
          filter by section, then settle in.
        </p>
      </section>

      <section className="container pb-6">
        <div className="rule h-px mb-4" />
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block ui-sans text-xs uppercase tracking-[0.18em] mb-1 text-[var(--plum-soft)]">
              Search
            </label>
            <input
              type="text"
              placeholder="Try: brain fog, HRT, sleep, rage..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.5)] border border-[var(--plum-text)] px-3 py-2 ui-sans text-sm focus:outline-none focus:border-[var(--rose-deep)]"
            />
          </div>
          <div>
            <label className="block ui-sans text-xs uppercase tracking-[0.18em] mb-1 text-[var(--plum-soft)]">
              Section
            </label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="bg-[rgba(255,255,255,0.5)] border border-[var(--plum-text)] px-3 py-2 ui-sans text-sm focus:outline-none focus:border-[var(--rose-deep)]"
            >
              {cats.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        {loading && <p className="text-[var(--plum-soft)]">Loading the archive...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-[var(--plum-soft)]">Nothing matches your filter yet. Try a broader search.</p>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {filtered.map((a) => (
            <Link key={a.slug} href={`/articles/${a.slug}`} className="no-underline text-[var(--plum-text)]">
              <article className="editorial-card overflow-hidden h-full flex flex-col">
                <div className="aspect-[4/3]">
                  <img
                    src={a.heroUrl}
                    alt={a.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="badge-category">{a.category}</span>
                  <h3 className="editorial-serif text-xl mt-3">{a.title}</h3>
                  <p className="text-sm mt-2 text-[var(--plum-soft)] flex-1">{a.metaDescription}</p>
                  <div className="ui-sans uppercase text-[10px] tracking-[0.2em] mt-4 text-[var(--rose-deep)]">
                    {fmtDate(a.publishedAt)}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
