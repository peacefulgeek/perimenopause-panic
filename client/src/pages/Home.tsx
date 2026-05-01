import { Link } from "wouter";
import { SiteShell } from "@/components/SiteShell";
import { useArticles, type ArticleSummary } from "@/lib/articlesApi";
import { ArrowRight } from "lucide-react";

function fmtDate(s: string | null): string {
  if (!s) return "";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ArticleCard({ a, size = "md" }: { a: ArticleSummary; size?: "lg" | "md" | "sm" }) {
  return (
    <article className="editorial-card overflow-hidden">
      <Link href={`/articles/${a.slug}`} className="no-underline text-[var(--plum-text)]">
        <div className={size === "lg" ? "aspect-[16/9]" : size === "sm" ? "aspect-[16/10]" : "aspect-[4/3]"}>
          <img
            src={a.heroUrl}
            alt={a.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="p-5">
          <span className="badge-category">{a.category}</span>
          <h3 className={size === "lg" ? "editorial-serif text-3xl mt-3" : "editorial-serif text-xl mt-3"}>{a.title}</h3>
          <p className="text-sm mt-2 text-[var(--plum-soft)] leading-snug">{a.metaDescription}</p>
          <div className="ui-sans uppercase text-[10px] tracking-[0.2em] mt-3 text-[var(--rose-deep)]">
            {fmtDate(a.publishedAt)}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function Home() {
  const { data: articles } = useArticles();
  const list = articles || [];
  const lead = list[0];
  const subLead = list.slice(1, 3);
  const more = list.slice(3, 9);
  const evergreen = list.slice(9, 15);

  return (
    <SiteShell>
      {/* Editorial intro band — image-rich without a single hero image */}
      <section className="container pt-8 pb-12">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <div className="badge-category">From the Editor</div>
            <h1 className="editorial-serif mt-4">
              The hormonal decade nobody warned you about.
            </h1>
            <p className="mt-5 text-lg leading-relaxed max-w-prose">
              Perimenopause begins, on average, in your late 30s. Your doctor
              probably did not mention it. The internet probably patronised
              you about it. We do neither. <em>Perimenopause Panic</em> is a
              warm, evidence-led broadsheet about estrogen, progesterone, the
              brain, the body, the work, and the rage. Written for the women
              who are ready to read.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/articles" className="btn-soft no-underline">
                Read the archive
              </Link>
              <Link href="/assessments" className="btn-ghost no-underline">
                Soft self check-in
              </Link>
              <Link href="/herbs" className="btn-ghost no-underline">
                Herbs &amp; supplements
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="watercolor-frame">
              <img
                src="https://perimenopause.b-cdn.net/library/lib-01.webp"
                alt="Watercolor still life of peonies and rose quartz on cream paper"
                className="w-full aspect-[3/4] object-cover"
                loading="lazy"
              />
            </div>
            <div className="grid grid-rows-2 gap-3">
              <div className="watercolor-frame">
                <img
                  src="https://perimenopause.b-cdn.net/library/lib-07.webp"
                  alt="Soft watercolor of dried lavender bouquet and ceramic teacup on cream paper"
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                />
              </div>
              <div className="watercolor-frame">
                <img
                  src="https://perimenopause.b-cdn.net/library/lib-12.webp"
                  alt="Watercolor wash of soft pink camellia blossoms with gold leaf accents"
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container"><div className="rule h-px" /></div>

      {/* Lead + sublead band */}
      {lead && (
        <section className="container py-12 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8"><ArticleCard a={lead} size="lg" /></div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            {subLead.map((a) => <ArticleCard key={a.slug} a={a} size="sm" />)}
          </div>
        </section>
      )}

      {/* Three-column dispatch */}
      {more.length > 0 && (
        <section className="container py-10">
          <div className="flex items-end justify-between mb-6">
            <h2 className="editorial-serif text-3xl">From the desk</h2>
            <Link href="/articles" className="ui-sans text-sm uppercase tracking-[0.2em] no-underline text-[var(--rose-deep)] inline-flex items-center gap-2">
              All articles <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {more.map((a) => <ArticleCard key={a.slug} a={a} />)}
          </div>
        </section>
      )}

      {/* Pull quote — site voice */}
      <section className="container py-16">
        <blockquote className="pull-quote" style={{background:"linear-gradient(180deg, rgba(244,212,208,0.7), rgba(217,199,225,0.55))", borderLeft:"5px solid var(--rose-deep)", padding:"2rem 2.4rem", borderRadius:"0 24px 24px 0"}}>
          <p className="editorial-serif text-3xl leading-snug max-w-3xl mx-auto">
            “Perimenopause is not a vibe. It is an endocrinology event with a
            twelve-year arc and a tendency to ambush you in the cereal aisle.”
          </p>
          <div className="ui-sans text-xs uppercase tracking-[0.25em] mt-4 text-center text-[var(--rose-deep)]">
            The Oracle Lover
          </div>
        </blockquote>
      </section>

      {/* Evergreen grid */}
      {evergreen.length > 0 && (
        <section className="container py-10 pb-16">
          <h2 className="editorial-serif text-3xl mb-6">The evergreen shelf</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evergreen.map((a) => <ArticleCard key={a.slug} a={a} />)}
          </div>
        </section>
      )}
    </SiteShell>
  );
}
