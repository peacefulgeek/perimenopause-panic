import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { SiteShell } from "@/components/SiteShell";
import { useArticle, useArticles } from "@/lib/articlesApi";
import { ArrowLeft } from "lucide-react";

function fmtDate(s: string | null): string {
  if (!s) return "";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ArticleDetail() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug;
  const { data, loading, error } = useArticle(slug);
  const { data: all } = useArticles();
  const [toc, setToc] = useState<{ id: string; text: string }[]>([]);

  // After body renders, extract H2s into TOC and assign IDs
  useEffect(() => {
    if (!data) return;
    setTimeout(() => {
      const root = document.getElementById("article-body");
      if (!root) return;
      const headings = Array.from(root.querySelectorAll("h2"));
      const items: { id: string; text: string }[] = [];
      headings.forEach((h, i) => {
        const text = (h.textContent || "").trim();
        const id = "sec-" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + i;
        h.id = id;
        items.push({ id, text });
      });
      setToc(items);
    }, 30);
  }, [data]);

  const related = useMemo(() => {
    if (!data || !all) return [];
    return all
      .filter((a) => a.slug !== data.slug && a.category === data.category)
      .slice(0, 4);
  }, [data, all]);

  if (loading) {
    return (
      <SiteShell>
        <section className="container py-20 text-[var(--plum-soft)]">Loading article...</section>
      </SiteShell>
    );
  }
  if (error || !data) {
    return (
      <SiteShell>
        <section className="container py-20">
          <h1 className="editorial-serif text-4xl">Article not found</h1>
          <p className="mt-4 text-[var(--plum-soft)]">
            We could not find that piece. <Link href="/articles">Browse the archive</Link>.
          </p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <article className="container py-10">
        <Link href="/articles" className="ui-sans text-xs tracking-[0.2em] uppercase no-underline text-[var(--rose-deep)] inline-flex items-center gap-2 mb-6">
          <ArrowLeft size={14} /> All articles
        </Link>
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Sticky TOC */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-6">
              <div className="ui-sans uppercase text-xs tracking-[0.2em] text-[var(--plum-soft)] mb-3">
                In this article
              </div>
              <nav className="border-l border-[var(--plum-text)] pl-3">
                {toc.length === 0 ? (
                  <span className="text-xs text-[var(--plum-soft)]">Sections will appear as you scroll.</span>
                ) : (
                  toc.map((t) => (
                    <a key={t.id} href={`#${t.id}`} className="toc-link">{t.text}</a>
                  ))
                )}
              </nav>
              <div className="rule h-px my-6" />
              <div className="ui-sans uppercase text-xs tracking-[0.2em] text-[var(--plum-soft)] mb-3">
                Reading time
              </div>
              <p className="text-sm text-[var(--plum-text)]">{data.readingTime} min</p>
            </div>
          </aside>

          {/* Article */}
          <div className="lg:col-span-9 order-1 lg:order-2">
            <span className="badge-category">{data.category}</span>
            <h1 className="editorial-serif mt-4">{data.title}</h1>
            <p className="ui-sans text-xs uppercase tracking-[0.2em] text-[var(--rose-deep)] mt-4">
              By{" "}
              <a
                href="https://theoraclelover.com"
                target="_blank"
                rel="noopener"
                className="underline decoration-[var(--rose-deep)] underline-offset-4"
              >
                {data.author}
              </a>{" "}
              ·{" "}
              <time dateTime={data.publishedAt || ""}>{fmtDate(data.publishedAt)}</time>
              {" "}· <span>{data.readingTime} min read</span>
            </p>
            <p className="ui-sans text-[11px] tracking-[0.18em] uppercase text-[var(--plum-soft)] mt-2">
              An editorial from{" "}
              <a
                href="https://theoraclelover.com"
                target="_blank"
                rel="noopener"
                className="underline decoration-[var(--rose-deep)] underline-offset-4 text-[var(--rose-deep)]"
              >
                The Oracle Lover
              </a>
            </p>
            <figure className="mt-6 mb-10">
              <img
                src={data.heroUrl}
                alt={data.imageAlt}
                className="w-full aspect-[16/9] object-cover border border-[var(--plum-text)]"
              />
              <figcaption className="ui-sans text-xs uppercase tracking-[0.18em] mt-2 text-[var(--plum-soft)]">
                {data.imageAlt}
              </figcaption>
            </figure>

            <div
              id="article-body"
              className="article-prose"
              dangerouslySetInnerHTML={{ __html: data.body }}
            />

            {related.length > 0 && (
              <section className="mt-16 pt-10 border-t border-[var(--plum-text)]">
                <h2 className="editorial-serif text-2xl mb-4">More from {data.category}</h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {related.map((r) => (
                    <Link key={r.slug} href={`/articles/${r.slug}`} className="editorial-card p-4 no-underline text-[var(--plum-text)]">
                      <div className="badge-category">{r.category}</div>
                      <h3 className="editorial-serif text-lg mt-2">{r.title}</h3>
                      <p className="text-sm mt-2 text-[var(--plum-soft)]">{r.metaDescription}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
