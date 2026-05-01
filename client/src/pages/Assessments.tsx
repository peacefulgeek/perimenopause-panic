import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SiteShell } from "@/components/SiteShell";
import { Heart } from "lucide-react";

interface Item { slug: string; title: string; oneLiner: string; blurb: string; imageKey: string; estimatedMinutes: number }

const BUNNY = "https://perimenopause.b-cdn.net";

export default function Assessments() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    fetch("/api/assessments").then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <SiteShell>
      <section className="container py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
          <div>
            <p className="ui-sans uppercase text-xs tracking-[0.3em]" style={{ color: "var(--rose-deep)" }}>Soft Check-Ins</p>
            <h1 className="editorial-serif text-5xl md:text-6xl mt-2" style={{ color: "var(--plum-text)" }}>
              Eleven gentle assessments<br />
              <span className="script" style={{ color: "var(--rose-deep)" }}>for the unraveling decade.</span>
            </h1>
            <p className="mt-5 max-w-prose" style={{ color: "var(--plum-soft)" }}>
              These are not diagnoses. They are nurturing self-recognition tools, written so you can see
              yourself softly and make a kinder next decision. Each takes about three minutes. None requires
              a sign-in.
            </p>
            <p className="mt-3 ui-sans text-sm" style={{ color: "var(--mauve-deep)" }}>
              <Heart className="inline mr-2" size={14} /> Answer truthfully. Nothing is recorded.
            </p>
          </div>
          <div className="watercolor-frame">
            <img src={`${BUNNY}/heroes/hero-assessments.webp`} alt="Watercolor of pressed wildflowers" className="w-full" loading="lazy" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((a) => (
            <Link key={a.slug} href={`/assessments/${a.slug}`} className="card-soft no-underline block group">
              <div className="aspect-[4/3] overflow-hidden mb-4 watercolor-frame">
                <img src={`${BUNNY}/assessments/assess-${a.imageKey}.webp`} alt={a.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
              </div>
              <p className="ui-sans uppercase text-[10px] tracking-[0.3em]" style={{ color: "var(--rose-deep)" }}>{a.estimatedMinutes} min · soft check-in</p>
              <h2 className="editorial-serif text-2xl mt-1" style={{ color: "var(--plum-text)" }}>{a.title}</h2>
              <p className="text-sm italic mt-2" style={{ color: "var(--mauve-deep)" }}>{a.oneLiner}</p>
              <p className="text-sm mt-3" style={{ color: "var(--plum-soft)" }}>{a.blurb}</p>
              <p className="ui-sans text-xs uppercase tracking-[0.22em] mt-5" style={{ color: "var(--rose-deep)" }}>Begin →</p>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
