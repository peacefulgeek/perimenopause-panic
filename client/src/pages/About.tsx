import { SiteShell } from "@/components/SiteShell";

export default function About() {
  return (
    <SiteShell>
      <section className="container py-10">
        <div className="badge-category">About</div>
        <h1 className="editorial-serif mt-4">The Oracle Lover.</h1>
        <p className="mt-4 max-w-2xl text-[var(--plum-soft)]">
          Perimenopause Panic is the editorial sister site of{" "}
          <a href="https://theoraclelover.com" rel="noopener" className="text-[var(--rose-deep)]">
            theoraclelover.com
          </a>. We write about the hormonal decade nobody warned you about,
          the way we wish someone had written to us. Direct, warm,
          evidence-led, never patronising.
        </p>
        <div className="grid md:grid-cols-12 gap-8 mt-10">
          <div className="md:col-span-7 article-prose">
            <p>
              <span className="dropcap-anchor">P</span>erimenopause begins, on
              average, in the late thirties. Most women are not told. The few
              who are told are handed an SSRI and a polite shrug. We disagree
              with that. So we built an editorial broadsheet that takes the
              hormonal decade seriously. Estrogen and progesterone get top
              billing. The brain is the lead instrument. The body is the rest
              of the orchestra. The work is the score.
            </p>
            <p>
              We write under the byline <strong>The Oracle Lover</strong>: an
              intuitive teacher with twenty years of practice on the subjects
              of attention, the body, and the way grown women learn. The
              evidence comes from peer-reviewed work, government health
              agencies, and the practitioners who have read the studies. The
              voice comes from a long table, a warm room, and the sense that
              you are old enough to handle the truth.
            </p>
            <p>
              No clickbait. No miracle protocols. No identity leakage. If a
              link buys us a coffee at Amazon, we mark it (paid link) and we
              tell you why we picked it.
            </p>
          </div>
          <div className="md:col-span-5 grid grid-cols-2 gap-3">
            <div className="watercolor-frame"><img src="https://perimenopause.b-cdn.net/library/lib-04.webp" alt="Watercolor still life of peonies and rose quartz on cream paper" className="aspect-[3/4] object-cover w-full" /></div>
            <div className="watercolor-frame"><img src="https://perimenopause.b-cdn.net/library/lib-18.webp" alt="Soft watercolor of dried lavender bouquet on cream paper" className="aspect-[3/4] object-cover w-full" /></div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
