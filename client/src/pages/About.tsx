import { SiteShell } from "@/components/SiteShell";

const BUNNY = "https://perimenopause.b-cdn.net";

export default function About() {
  return (
    <SiteShell>
      {/* Masthead */}
      <section className="container pt-12 pb-6">
        <div className="badge-category">About</div>
        <h1 className="editorial-serif mt-4 text-5xl md:text-6xl">
          The Oracle Lover.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--plum-soft)] leading-relaxed">
          Perimenopause Panic is the perimenopause desk of{" "}
          <a
            href="https://theoraclelover.com"
            target="_blank"
            rel="noopener"
            className="text-[var(--rose-deep)] underline decoration-[var(--rose-deep)] underline-offset-4"
          >
            The Oracle Lover
          </a>
          &nbsp;— a mentor and writer who has spent twenty years sitting with
          women through the parts of life nobody narrates well: the
          unraveling of the cycle, the late-thirties brain change, the rage
          that arrives without warning, the grief inside what should be
          relief. He writes the way he speaks in person. Soft, exact, never
          patronising, never hurried.
        </p>
      </section>

      {/* Portrait + intro grid */}
      <section className="container pb-10">
        <div className="grid md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            <div className="watercolor-frame">
              <img
                src={`${BUNNY}/library/lib-04.webp`}
                alt="Watercolor of peonies and rose quartz, the editorial signature of The Oracle Lover"
                className="aspect-[3/4] object-cover w-full"
              />
            </div>
            <div className="watercolor-frame mt-6">
              <img
                src={`${BUNNY}/library/lib-18.webp`}
                alt="Soft watercolor of dried lavender, an emblem of the calm voice The Oracle Lover writes in"
                className="aspect-[3/4] object-cover w-full"
              />
            </div>
            <div className="watercolor-frame -mt-4">
              <img
                src={`${BUNNY}/library/lib-09.webp`}
                alt="Watercolor of a porcelain teacup with herbs, a quiet ritual the editorial returns to"
                className="aspect-[3/4] object-cover w-full"
              />
            </div>
            <div className="watercolor-frame">
              <img
                src={`${BUNNY}/library/lib-12.webp`}
                alt="Watercolor of magnolia and pearls, evoking the broadsheet's softness with substance"
                className="aspect-[3/4] object-cover w-full"
              />
            </div>
          </div>

          <div className="md:col-span-7 article-prose">
            <p>
              <span className="dropcap-anchor">T</span>he Oracle Lover began
              as a quiet practice. Women would arrive at the table with the
              same sentence in different costumes:{" "}
              <em>
                I do not recognise myself, and the doctor said I was fine.
              </em>{" "}
              He listened the way a good clinician listens, and he answered
              the way a teacher answers — with the studies in one hand and
              the lived body in the other. After enough years, the
              conversations became a body of work. After enough body of
              work, they became this site.
            </p>
            <p>
              His promise on this page is small and exact. Every essay you
              read here is written or edited under the byline{" "}
              <strong>The Oracle Lover</strong>. Every claim is sourced from
              peer-reviewed work, NHS or NIH guidance, the British Menopause
              Society, ACOG, or the practitioners who actually read those
              papers. Every Amazon link carries the affiliate tag{" "}
              <code>spankyspinola-20</code> and is marked{" "}
              <em>(paid link)</em> in the body text. If a piece buys a cup
              of coffee for the editorial, it never buys an inch of the
              opinion.
            </p>
            <p>
              He writes for the woman who is old enough to handle the truth
              and tired of being handed a leaflet instead. The voice is
              warm. The evidence is rigorous. The point of the broadsheet
              is to make the next ten years feel less like an ambush and
              more like an unfolding you were quietly equipped for.
            </p>
            <p className="mt-6">
              <a
                href="https://theoraclelover.com"
                target="_blank"
                rel="noopener"
                className="inline-block px-5 py-3 bg-[var(--rose-deep)] text-[var(--cream)] no-underline rounded-full ui-sans uppercase text-xs tracking-[0.2em]"
              >
                Read more from The Oracle Lover →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* What he stands for */}
      <section className="container py-12">
        <div className="rule h-px mb-8" />
        <h2 className="editorial-serif text-3xl mb-6">
          What he stands for.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card-soft p-6">
            <div className="badge-category mb-3">Tone</div>
            <h3 className="editorial-serif text-xl mb-2">
              Soft voice. Hard evidence.
            </h3>
            <p className="text-[var(--plum-text)] leading-relaxed text-sm">
              Nothing is dumbed down for you. Nothing is dressed up to look
              clinical when it isn't. The reader is treated as the
              intelligent adult she is.
            </p>
          </div>
          <div className="card-soft p-6">
            <div className="badge-category mb-3">Sourcing</div>
            <h3 className="editorial-serif text-xl mb-2">
              The studies, named and linked.
            </h3>
            <p className="text-[var(--plum-text)] leading-relaxed text-sm">
              Every claim that needs a citation gets one — NIH, ACOG, NICE,
              NHS, the menopause societies, the Lancet, the BMJ. No vibes,
              no gurus, no guesswork.
            </p>
          </div>
          <div className="card-soft p-6">
            <div className="badge-category mb-3">Money</div>
            <h3 className="editorial-serif text-xl mb-2">
              Disclosed, not disguised.
            </h3>
            <p className="text-[var(--plum-text)] leading-relaxed text-sm">
              Affiliate links are marked <em>(paid link)</em> at the point
              of use. We do not recommend a product we wouldn't hand to a
              woman we love.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial principles */}
      <section className="container py-12">
        <div className="rule h-px mb-8" />
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="badge-category mb-3">Editorial principles</div>
            <h2 className="editorial-serif text-3xl">
              The four lines we don't cross.
            </h2>
            <p className="mt-3 text-[var(--plum-soft)] leading-relaxed">
              These are the lines The Oracle Lover holds across every piece
              on this site. They exist because perimenopause writing on the
              internet is overwhelmingly bad, and the reader deserves the
              corrective.
            </p>
          </div>
          <div className="md:col-span-7 space-y-5">
            <div className="card-soft p-5">
              <h3 className="editorial-serif text-lg">
                One. Never frighten her.
              </h3>
              <p className="text-sm mt-1 text-[var(--plum-text)] leading-relaxed">
                A symptom is described in proportion to its actual risk, not
                to the click it generates.
              </p>
            </div>
            <div className="card-soft p-5">
              <h3 className="editorial-serif text-lg">
                Two. Never reduce her to a hormone.
              </h3>
              <p className="text-sm mt-1 text-[var(--plum-text)] leading-relaxed">
                Estrogen is a lead instrument, not the whole orchestra. The
                writing keeps the woman in view.
              </p>
            </div>
            <div className="card-soft p-5">
              <h3 className="editorial-serif text-lg">
                Three. Never sell her a miracle.
              </h3>
              <p className="text-sm mt-1 text-[var(--plum-text)] leading-relaxed">
                Supplement section is curated, not pushed. Real benefit,
                real dose, real source — or it stays out of the library.
              </p>
            </div>
            <div className="card-soft p-5">
              <h3 className="editorial-serif text-lg">
                Four. Always send her further.
              </h3>
              <p className="text-sm mt-1 text-[var(--plum-text)] leading-relaxed">
                Every essay points to a clinician-read piece, a Society
                guideline, and{" "}
                <a
                  href="https://theoraclelover.com"
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--rose-deep)] underline decoration-[var(--rose-deep)] underline-offset-4"
                >
                  the larger body of work at theoraclelover.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container py-16">
        <div className="rule h-px mb-8" />
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <h2 className="editorial-serif text-4xl">
              Want the longer conversation?
            </h2>
            <p className="mt-4 text-[var(--plum-soft)] leading-relaxed text-lg">
              Perimenopause Panic is the perimenopause desk. The wider work
              — on attention, the inner life, the body, the way grown women
              learn — lives on the home publication.
            </p>
            <p className="mt-6">
              <a
                href="https://theoraclelover.com"
                target="_blank"
                rel="noopener"
                className="inline-block px-6 py-3 bg-[var(--rose-deep)] text-[var(--cream)] no-underline rounded-full ui-sans uppercase text-xs tracking-[0.2em]"
              >
                Visit The Oracle Lover →
              </a>
            </p>
          </div>
          <div className="md:col-span-5">
            <div className="watercolor-frame">
              <img
                src={`${BUNNY}/library/lib-15.webp`}
                alt="Watercolor of an open notebook and a sprig of rosemary, the editorial mood of The Oracle Lover"
                className="aspect-[5/4] object-cover w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
