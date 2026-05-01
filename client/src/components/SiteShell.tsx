import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/articles", label: "Articles" },
  { href: "/tools-we-recommend", label: "Tools" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)]">
      <header className="masthead bg-[var(--cream)]">
        <div className="container py-4 flex items-center justify-between gap-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
            className="ui-sans text-sm tracking-widest uppercase flex items-center gap-2"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
            <span className="hidden sm:inline">Menu</span>
          </button>

          <Link href="/" className="text-center no-underline">
            <div className="editorial-serif text-3xl md:text-5xl leading-none text-[var(--brown)]">
              Perimenopause Panic
            </div>
            <div className="ui-sans text-[10px] md:text-xs tracking-[0.35em] uppercase text-[var(--terra-deep)] mt-1">
              The Hormonal Decade Nobody Warned You About
            </div>
          </Link>

          <Link
            href="/articles"
            className="ui-sans text-sm tracking-widest uppercase no-underline text-[var(--brown)] hover:text-[var(--terra-deep)] hidden sm:inline"
          >
            Read
          </Link>
        </div>
        <div className="container pb-3">
          <div className="rule h-px" />
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-80 bg-[var(--cream)] border-r border-[var(--brown)] p-8 overflow-y-auto">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="ui-sans text-sm tracking-widest uppercase flex items-center gap-2 mb-8"
            >
              <X size={18} /> Close
            </button>
            <div className="editorial-serif text-2xl mb-6">Sections</div>
            <nav className="flex flex-col gap-3">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="ui-sans uppercase tracking-[0.2em] text-sm no-underline text-[var(--brown)] hover:text-[var(--terra-deep)]"
                >
                  {n.label}
                </Link>
              ))}
              <div className="rule h-px my-4" />
              <Link
                href="/disclosures"
                onClick={() => setOpen(false)}
                className="ui-sans text-xs uppercase tracking-[0.18em] no-underline text-[var(--brown-soft)]"
              >
                Disclosures
              </Link>
              <Link
                href="/privacy"
                onClick={() => setOpen(false)}
                className="ui-sans text-xs uppercase tracking-[0.18em] no-underline text-[var(--brown-soft)]"
              >
                Privacy
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="mt-24 border-t border-[var(--brown)] bg-[var(--cream-deep)]">
        <div className="container py-12 grid md:grid-cols-3 gap-10">
          <div>
            <div className="editorial-serif text-2xl">Perimenopause Panic</div>
            <p className="text-sm mt-2 text-[var(--brown-soft)]">
              Edited and tended by The Oracle Lover. Evidence-led, warm, never
              patronising.
            </p>
            <p className="text-xs mt-4 text-[var(--brown-soft)]">
              Editorial sister site of{" "}
              <a
                href="https://theoraclelover.com"
                rel="noopener"
                className="text-[var(--terra-deep)]"
              >
                theoraclelover.com
              </a>
              .
            </p>
          </div>
          <div>
            <div className="ui-sans uppercase text-xs tracking-[0.18em] text-[var(--brown)] mb-3">
              Sections
            </div>
            <ul className="text-sm space-y-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-[var(--brown-soft)] no-underline hover:text-[var(--terra-deep)]">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="ui-sans uppercase text-xs tracking-[0.18em] text-[var(--brown)] mb-3">
              Fine print
            </div>
            <ul className="text-sm space-y-2">
              <li><Link href="/disclosures" className="text-[var(--brown-soft)] no-underline">Disclosures</Link></li>
              <li><Link href="/privacy" className="text-[var(--brown-soft)] no-underline">Privacy</Link></li>
              <li><Link href="/contact" className="text-[var(--brown-soft)] no-underline">Contact</Link></li>
            </ul>
            <p className="text-xs mt-6 text-[var(--brown-soft)]">
              As an Amazon Associate we earn from qualifying purchases.
            </p>
          </div>
        </div>
        <div className="container py-6 border-t border-[var(--brown)] text-xs text-[var(--brown-soft)]">
          © {new Date().getFullYear()} Perimenopause Panic. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
