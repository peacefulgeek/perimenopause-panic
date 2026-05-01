import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { SiteShell } from "@/components/SiteShell";
import { ArrowLeft, ExternalLink, Leaf } from "lucide-react";

interface Herb { slug: string; name: string; latin: string; family: string; category: string; oneLiner: string; sentences: string[]; asin: string; imageKey: string }

const BUNNY = "https://perimenopause.b-cdn.net";
const TAG = "spankyspinola-20";

export default function HerbDetail() {
  const [, params] = useRoute("/herbs/:slug");
  const slug = params?.slug ?? "";
  const [h, setH] = useState<Herb | null>(null);
  const [related, setRelated] = useState<Herb[]>([]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/herbs/${slug}`).then((r) => r.json()).then((herb) => {
      setH(herb);
      if (herb?.category) {
        fetch(`/api/herbs?category=${encodeURIComponent(herb.category)}`).then((r) => r.json()).then((all: Herb[]) => {
          setRelated(all.filter((x) => x.slug !== herb.slug).slice(0, 6));
        });
      }
    }).catch(() => setH(null));
  }, [slug]);

  if (!h) {
    return (
      <SiteShell>
        <div className="container py-24 text-center" style={{ color: "var(--plum-soft)" }}>Tending the page…</div>
      </SiteShell>
    );
  }

  const amazonUrl = `https://www.amazon.com/dp/${h.asin}/?tag=${TAG}`;

  return (
    <SiteShell>
      <article className="container py-12 max-w-4xl">
        <Link href="/herbs" className="ui-sans uppercase text-xs tracking-[0.22em] no-underline inline-flex items-center gap-2 mb-6" style={{ color: "var(--rose-deep)" }}>
          <ArrowLeft size={14} /> All herbs &amp; supplements
        </Link>

        <div className="grid md:grid-cols-[320px_1fr] gap-10 items-start">
          <div className="watercolor-frame">
            <img src={`${BUNNY}/${h.imageKey}`} alt={h.name} className="w-full" loading="lazy" />
          </div>
          <div>
            <p className="ui-sans uppercase text-xs tracking-[0.3em] flex items-center gap-2" style={{ color: "var(--rose-deep)" }}>
              <Leaf size={12} /> {h.category}
            </p>
            <h1 className="editorial-serif text-5xl mt-2" style={{ color: "var(--plum-text)" }}>{h.name}</h1>
            <p className="italic text-lg mt-1" style={{ color: "var(--mauve-deep)" }}>{h.latin} · <span className="ui-sans text-sm">{h.family}</span></p>
            <p className="text-xl leading-snug mt-4 editorial-serif" style={{ color: "var(--plum-text)" }}>"{h.oneLiner}"</p>

            <div className="mt-8 space-y-4">
              {h.sentences.map((s, i) => (
                <p key={i} className="text-lg leading-relaxed" style={{ color: "var(--plum-text)" }}>{s}</p>
              ))}
            </div>

            <div className="card-soft mt-8" style={{ background: "rgba(248, 226, 217, 0.55)" }}>
              <p className="ui-sans uppercase text-xs tracking-[0.22em]" style={{ color: "var(--rose-deep)" }}>Where to source</p>
              <p className="editorial-serif text-xl mt-2" style={{ color: "var(--plum-text)" }}>
                We've vetted a third-party tested option on Amazon.
              </p>
              <a
                href={amazonUrl}
                rel="sponsored noopener"
                target="_blank"
                className="btn-soft inline-flex items-center gap-2 mt-4 no-underline"
              >
                Open the verified Amazon listing <ExternalLink size={14} />
              </a>
              <p className="ui-sans text-xs mt-3" style={{ color: "var(--plum-soft)" }}>
                Affiliate · Amazon Associates tag {TAG} · we earn a small commission at no extra cost to
                you. Always check with your prescriber before adding any new supplement.
              </p>
            </div>

            <div className="mt-8">
              <p className="ui-sans uppercase text-xs tracking-[0.22em]" style={{ color: "var(--mauve-deep)" }}>Self-recognition</p>
              <p className="text-base mt-2" style={{ color: "var(--plum-soft)" }}>
                Not sure where to start? Take{" "}
                <Link href="/assessments/symptom-burden" className="no-underline" style={{ color: "var(--rose-deep)" }}>the symptom-burden soft check-in</Link>{" "}
                to see which herbs may meet you most kindly today.
              </p>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <p className="ui-sans uppercase text-xs tracking-[0.22em]" style={{ color: "var(--mauve-deep)" }}>More from {h.category}</p>
            <hr className="rule-soft mt-2 mb-6" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link key={r.slug} href={`/herbs/${r.slug}`} className="card-soft no-underline block">
                  <div className="aspect-[4/3] overflow-hidden mb-3 watercolor-frame">
                    <img src={`${BUNNY}/${r.imageKey}`} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <h3 className="editorial-serif text-xl" style={{ color: "var(--plum-text)" }}>{r.name}</h3>
                  <p className="text-sm italic" style={{ color: "var(--mauve-deep)" }}>{r.latin}</p>
                  <p className="text-sm mt-2" style={{ color: "var(--plum-soft)" }}>{r.oneLiner}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </SiteShell>
  );
}
