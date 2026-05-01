import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { SiteShell } from "@/components/SiteShell";
import { Search, Leaf } from "lucide-react";

interface Herb { slug: string; name: string; latin: string; category: string; oneLiner: string; sentences: string[]; asin: string; imageKey: string }

const BUNNY = "https://perimenopause.b-cdn.net";

export default function Herbs() {
  const [items, setItems] = useState<Herb[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");

  useEffect(() => {
    fetch("/api/herbs").then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((h) => h.category))).sort()], [items]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((h) => {
      if (cat !== "All" && h.category !== cat) return false;
      if (!term) return true;
      return h.name.toLowerCase().includes(term) || h.latin.toLowerCase().includes(term) || h.oneLiner.toLowerCase().includes(term);
    });
  }, [items, q, cat]);

  return (
    <SiteShell>
      <section className="container py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-10">
          <div>
            <p className="ui-sans uppercase text-xs tracking-[0.3em]" style={{ color: "var(--rose-deep)" }}>Hormone Health Library</p>
            <h1 className="editorial-serif text-5xl md:text-6xl mt-2" style={{ color: "var(--plum-text)" }}>
              Herbs, TCM &amp; supplements,<br />
              <span className="script" style={{ color: "var(--rose-deep)" }}>tended like a still room.</span>
            </h1>
            <p className="mt-5 max-w-prose" style={{ color: "var(--plum-soft)" }}>
              {items.length}+ plant allies and supplements, each with a short field note and a verified Amazon
              link. Curated for perimenopausal bodies. Always check with your prescriber before adding
              anything new — this is reference material, not a prescription.
            </p>
          </div>
          <div className="watercolor-frame">
            <img src={`${BUNNY}/heroes/hero-herbs.webp`} alt="Watercolor still life of dried herbs and roots" className="w-full" loading="lazy" />
          </div>
        </div>

        <div className="card-soft mb-10 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="flex-1 flex items-center gap-3 px-3" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(201,122,140,0.3)" }}>
            <Search size={16} style={{ color: "var(--mauve-deep)" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by common or Latin name…"
              className="flex-1 bg-transparent py-3 outline-none editorial-serif text-base"
              style={{ color: "var(--plum-text)" }}
            />
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="ui-sans uppercase tracking-[0.18em] text-xs px-4 py-3"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(201,122,140,0.3)", color: "var(--plum-text)" }}
          >
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <p className="ui-sans uppercase text-xs tracking-[0.22em] mb-4" style={{ color: "var(--mauve-deep)" }}>{filtered.length} entries</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((h) => (
            <Link key={h.slug} href={`/herbs/${h.slug}`} className="card-soft no-underline block group">
              <div className="aspect-[4/3] overflow-hidden mb-4 watercolor-frame">
                <img src={`${BUNNY}/${h.imageKey}`} alt={h.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
              </div>
              <p className="ui-sans uppercase text-[10px] tracking-[0.3em] flex items-center gap-2" style={{ color: "var(--rose-deep)" }}>
                <Leaf size={11} /> {h.category}
              </p>
              <h2 className="editorial-serif text-2xl mt-1" style={{ color: "var(--plum-text)" }}>{h.name}</h2>
              <p className="text-xs italic" style={{ color: "var(--mauve-deep)" }}>{h.latin}</p>
              <p className="text-sm mt-3" style={{ color: "var(--plum-text)" }}>{h.oneLiner}</p>
              <p className="ui-sans text-xs uppercase tracking-[0.22em] mt-4" style={{ color: "var(--rose-deep)" }}>Read field note →</p>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
