import { SiteShell } from "@/components/SiteShell";

export default function Disclosures() {
  return (
    <SiteShell>
      <section className="container py-10 article-prose">
        <div className="badge-category">Fine Print</div>
        <h1 className="editorial-serif mt-4">Disclosures</h1>
        <p>
          Perimenopause Panic participates in the Amazon Services LLC Associates
          Program. As an Amazon Associate we earn from qualifying purchases.
          Affiliate links are marked <em>(paid link)</em> in the body of every
          article and on the Tools We Recommend page. Our editorial choices
          are not influenced by commission rates. We routinely cite books and
          products with no commercial arrangement at all when they are the
          right answer.
        </p>
        <h2>Editorial standards</h2>
        <p>
          The site is reviewed and signed off by The Oracle Lover. Where a
          claim hinges on research, we cite the underlying study or an
          authoritative public-health source. We update articles when the
          evidence base moves, and we mark the Last updated date on the byline.
        </p>
        <h2>Medical disclaimer</h2>
        <p>
          Nothing on this site is medical advice. We are an editorial
          publication. For diagnosis or treatment, work with a clinician who
          is trained in menopause care.
        </p>
        <h2>How we choose products</h2>
        <p>
          We recommend products that meet four tests: a clear evidence base,
          a clean ingredient or build, a price that respects you, and a
          manufacturer with a track record. We rotate the shelf as new
          evidence and new options arrive.
        </p>
      </section>
    </SiteShell>
  );
}
