import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { SiteShell } from "@/components/SiteShell";
import { Heart, ArrowLeft } from "lucide-react";

interface Question { id: string; q: string; hint?: string }
interface ScoreBand { min: number; max: number; title: string; body: string; suggestArticles: string[]; suggestHerbs: string[] }
interface Assessment { slug: string; title: string; oneLiner: string; blurb: string; imageKey: string; estimatedMinutes: number; questions: Question[]; bands: ScoreBand[] }

const BUNNY = "https://perimenopause.b-cdn.net";
const LIKERT = [
  { v: 0, label: "never" },
  { v: 1, label: "sometimes" },
  { v: 2, label: "often" },
  { v: 3, label: "nearly always" },
];

export default function AssessmentDetail() {
  const [, params] = useRoute("/assessments/:slug");
  const slug = params?.slug ?? "";
  const [a, setA] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/assessments/${slug}`).then((r) => r.json()).then(setA).catch(() => setA(null));
  }, [slug]);

  const score = useMemo(() => Object.values(answers).reduce((s, v) => s + v, 0), [answers]);
  const totalMax = (a?.questions.length ?? 0) * 3;
  const band = useMemo(() => a?.bands.find((b) => score >= b.min && score <= b.max), [a, score]);

  if (!a) {
    return (
      <SiteShell>
        <div className="container py-24 text-center" style={{ color: "var(--plum-soft)" }}>Loading the soft check-in…</div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <article className="container py-12 max-w-4xl">
        <Link href="/assessments" className="ui-sans uppercase text-xs tracking-[0.22em] no-underline inline-flex items-center gap-2 mb-6" style={{ color: "var(--rose-deep)" }}>
          <ArrowLeft size={14} /> All assessments
        </Link>

        <div className="grid md:grid-cols-[280px_1fr] gap-10 items-start mb-10">
          <div className="watercolor-frame">
            <img src={`${BUNNY}/assessments/assess-${a.imageKey}.webp`} alt={a.title} className="w-full" loading="lazy" />
          </div>
          <div>
            <p className="ui-sans uppercase text-xs tracking-[0.3em]" style={{ color: "var(--rose-deep)" }}>{a.estimatedMinutes} minute soft check-in</p>
            <h1 className="editorial-serif text-4xl md:text-5xl mt-2" style={{ color: "var(--plum-text)" }}>{a.title}</h1>
            <p className="text-lg italic mt-3" style={{ color: "var(--mauve-deep)" }}>{a.oneLiner}</p>
            <p className="mt-4" style={{ color: "var(--plum-soft)" }}>{a.blurb}</p>
            <p className="ui-sans text-xs uppercase tracking-[0.2em] mt-5" style={{ color: "var(--rose-deep)" }}>
              <Heart className="inline mr-2" size={12} /> Nothing here is recorded. Answer for yourself.
            </p>
          </div>
        </div>

        {!submitted && (
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="space-y-8">
            {a.questions.map((q, i) => (
              <div key={q.id} className="card-soft">
                <p className="ui-sans uppercase text-[10px] tracking-[0.3em] mb-2" style={{ color: "var(--rose-deep)" }}>Question {i + 1} of {a.questions.length}</p>
                <p className="editorial-serif text-xl" style={{ color: "var(--plum-text)" }}>{q.q}</p>
                {q.hint && <p className="text-sm italic mt-2" style={{ color: "var(--mauve-deep)" }}>{q.hint}</p>}
                <div className="grid grid-cols-4 gap-3 mt-5">
                  {LIKERT.map((l) => {
                    const active = answers[q.id] === l.v;
                    return (
                      <button
                        key={l.v}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: l.v })}
                        className="ui-sans uppercase text-xs tracking-[0.2em] py-3 transition"
                        style={{
                          background: active ? "var(--rose-deep)" : "rgba(255,255,255,0.5)",
                          color: active ? "var(--cream)" : "var(--plum-text)",
                          border: "1px solid rgba(201,122,140,0.4)",
                        }}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={Object.keys(answers).length < a.questions.length}
              className="btn-soft text-base px-10 py-4 disabled:opacity-40"
            >
              Reveal what I'm noticing →
            </button>
            <p className="ui-sans text-xs" style={{ color: "var(--plum-soft)" }}>{Object.keys(answers).length} of {a.questions.length} answered</p>
          </form>
        )}

        {submitted && band && (
          <div className="card-soft" style={{ background: "rgba(248, 226, 217, 0.55)" }}>
            <p className="ui-sans uppercase text-xs tracking-[0.3em]" style={{ color: "var(--rose-deep)" }}>Your soft reflection</p>
            <h2 className="editorial-serif text-3xl md:text-4xl mt-2" style={{ color: "var(--plum-text)" }}>{band.title}</h2>
            <p className="ui-sans text-sm mt-1" style={{ color: "var(--mauve-deep)" }}>Score: {score} of {totalMax}</p>
            <p className="text-lg leading-relaxed mt-5" style={{ color: "var(--plum-text)" }}>{band.body}</p>

            {band.suggestArticles.length > 0 && (
              <div className="mt-8">
                <p className="ui-sans uppercase text-xs tracking-[0.22em] mb-3" style={{ color: "var(--mauve-deep)" }}>Reading that may meet you here</p>
                <ul className="space-y-2">
                  {band.suggestArticles.map((s) => (
                    <li key={s}>
                      <Link href={`/articles/${s}`} className="editorial-serif text-lg no-underline" style={{ color: "var(--rose-deep)" }}>
                        → {s.replace(/-/g, " ")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {band.suggestHerbs.length > 0 && (
              <div className="mt-6">
                <p className="ui-sans uppercase text-xs tracking-[0.22em] mb-3" style={{ color: "var(--mauve-deep)" }}>Plant allies worth meeting</p>
                <ul className="space-y-2">
                  {band.suggestHerbs.map((s) => (
                    <li key={s}>
                      <Link href={`/herbs/${s}`} className="editorial-serif text-lg no-underline" style={{ color: "var(--rose-deep)" }}>
                        → {s.replace(/-/g, " ")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="btn-soft mt-8">Re-take softly</button>
          </div>
        )}
      </article>
    </SiteShell>
  );
}
