import { SiteShell } from "@/components/SiteShell";

interface Tool {
  asin: string;
  name: string;
  category: string;
  blurb: string;
}

const TOOLS: Tool[] = [
  { asin: "0806541490", name: "The Menopause Manifesto by Jen Gunter MD", category: "Books", blurb: "The blunt, evidence-led primer. Read this first." },
  { asin: "0593713230", name: "The New Menopause by Mary Claire Haver MD", category: "Books", blurb: "Practical, modern, and unafraid of the metabolic chapter." },
  { asin: "059318395X", name: "The Menopause Brain by Lisa Mosconi PhD", category: "Books", blurb: "The neurology of estrogen, written for grown-ups." },
  { asin: "0316481211", name: "Estrogen Matters by Bluming and Tavris", category: "Books", blurb: "A clear-eyed look at the WHI fallout, twenty years on." },
  { asin: "1623367298", name: "ROAR by Stacy Sims PhD", category: "Books", blurb: "Strength, fueling, and physiology for women across the lifespan." },
  { asin: "B0019LRY8A", name: "Pure Encapsulations Magnesium Glycinate", category: "Supplements", blurb: "The form most women tolerate. Pairs well with sleep and tight muscles." },
  { asin: "B00CAZAU62", name: "Nordic Naturals Ultimate Omega High-EPA", category: "Supplements", blurb: "Mood and inflammation support. EPA-forward, low burp." },
  { asin: "B00JGCBGZQ", name: "Thorne Vitamin D plus K2 Liquid", category: "Supplements", blurb: "For bone and immune support when your levels run low." },
  { asin: "B07FDJMC9Q", name: "Hatch Restore 2 Sound Machine and Sunrise Alarm", category: "Sleep", blurb: "Wakes you with light, settles you with sound. Worth it." },
  { asin: "B0BFDR7HF1", name: "SlumberCloud Stratus Cooling Sheets", category: "Sleep", blurb: "Quiet help for night sweats. Soft, breathable, washable." },
  { asin: "B07Z9P2J5L", name: "Everlywell Womens Health Test", category: "Testing", blurb: "An at-home starting point. Bring results to a clinician." },
  { asin: "B07PWZRZ34", name: "LetsGetChecked Female Hormone Test", category: "Testing", blurb: "Same logic, different lab. Compare and choose." },
  { asin: "B001ARYU58", name: "Bowflex SelectTech 552 Adjustable Dumbbells", category: "Exercise", blurb: "Strength training is the protocol. These make it possible at home." },
  { asin: "B07P7XNYBC", name: "Bodylastics Resistance Bands Set", category: "Exercise", blurb: "Travel-friendly accessory work for shoulders, glutes, and rotator cuff." },
  { asin: "B000056VS4", name: "Replens Long-Lasting Vaginal Moisturizer", category: "Vaginal Health", blurb: "Non-hormonal, well tolerated, evidence-based." },
  { asin: "B07XTL9JHF", name: "Revaree Hyaluronic Acid Vaginal Inserts", category: "Vaginal Health", blurb: "Hyaluronic acid inserts for GSM. Gentle and effective." },
];

export default function Tools() {
  const grouped = TOOLS.reduce<Record<string, Tool[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});
  return (
    <SiteShell>
      <section className="container py-10">
        <div className="badge-category">Hormone Health Library</div>
        <h1 className="editorial-serif mt-4">Tools we recommend</h1>
        <p className="mt-4 max-w-2xl text-[var(--plum-soft)]">
          A short, considered shelf. Books we keep returning to, supplements we
          recommend with caveats, sleep aids that have actually helped, and
          tools that earn their place in a perimenopause toolkit. As an Amazon
          Associate we earn from qualifying purchases. Every link is marked
          (paid link).
        </p>
      </section>
      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="container pb-10">
          <h2 className="editorial-serif text-2xl mb-4">{cat}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((t) => {
              // Use a tag-bearing search URL instead of a direct /dp/<ASIN>
              // link. Amazon search results return real, current listings
              // even when an individual ASIN is retired, the affiliate tag
              // still credits us, and links never 404 for the user.
              const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(t.name)}&tag=spankyspinola-20`;
              return (
              <a
                key={t.asin}
                href={searchUrl}
                rel="nofollow sponsored noopener"
                target="_blank"
                className="editorial-card p-5 no-underline text-[var(--plum-text)] block"
              >
                <span className="badge-category">{cat}</span>
                <div className="editorial-serif text-lg mt-3">{t.name}</div>
                <p className="text-sm mt-2 text-[var(--plum-soft)]">{t.blurb}</p>
                <div className="ui-sans uppercase text-[10px] tracking-[0.2em] mt-4 text-[var(--rose-deep)]">
                  Find on Amazon (paid link)
                </div>
              </a>
              );
            })}
          </div>
        </section>
      ))}
    </SiteShell>
  );
}
