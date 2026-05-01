import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Heart } from "lucide-react";

const NAV = [
  { href: "/articles", label: "Articles" },
  { href: "/assessments", label: "Assessments" },
  { href: "/herbs", label: "Herbs & TCM" },
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
    <div className="min-h-screen flex flex-col">
      <header className="masthead">
        <div className="container py-5 grid grid-cols-3 items-center gap-4">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
            className="ui-sans text-sm tracking-[0.18em] uppercase flex items-center gap-2 justify-self-start"
            style={{ color: "var(--mauve-deep)" }}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
            <span className="hidden sm:inline">Menu</span>
          </button>

          <Link href="/" className="text-center no-underline justify-self-center">
            <div className="editorial-serif text-3xl md:text-5xl leading-none" style={{ color: "var(--plum-text)" }}>
              Perimenopause <span className="script" style={{ color: "var(--rose-deep)" }}>Panic</span>
            </div>
            <div className="ui-sans text-[10px] md:text-xs tracking-[0.4em] uppercase mt-1" style={{ color: "var(--rose-deep)" }}>
              Soft, Honest, Evidence-Led
            </div>
          </Link>

          <Link href="/assessments" className="btn-soft no-underline justify-self-end hidden md:inline-flex items-center gap-2">
            <Heart size={14} /> Begin a Soft Check-In
          </Link>
        </div>
        <div className="container">
          <hr className="rule-soft" />
        </div>

        {/* Desktop secondary nav */}
        <nav className="hidden md:block">
          <div className="container py-3 flex items-center justify-center gap-8">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="ui-sans text-[11px] tracking-[0.28em] uppercase no-underline"
                style={{ color: "var(--plum-soft)" }}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(91, 58, 82, 0.35)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-80 p-8 overflow-y-auto"
            style={{
              background: "rgba(253, 247, 241, 0.97)",
              borderRight: "1px solid rgba(201,122,140,0.35)",
              boxShadow: "16px 0 60px -32px rgba(139,99,131,0.45)",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="ui-sans text-sm tracking-[0.2em] uppercase flex items-center gap-2 mb-8"
              style={{ color: "var(--mauve-deep)" }}
            >
              <X size={18} /> Close
            </button>
            <div className="editorial-serif text-2xl mb-2" style={{ color: "var(--plum-text)" }}>Sections</div>
            <hr className="rule-soft mb-6" />
            <nav className="flex flex-col gap-4">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="ui-sans uppercase tracking-[0.22em] text-sm no-underline"
                  style={{ color: "var(--plum-text)" }}
                >
                  {n.label}
                </Link>
              ))}
              <hr className="rule-soft my-3" />
              <Link href="/disclosures" onClick={() => setOpen(false)} className="ui-sans text-xs uppercase tracking-[0.2em] no-underline" style={{ color: "var(--plum-soft)" }}>Disclosures</Link>
              <Link href="/privacy" onClick={() => setOpen(false)} className="ui-sans text-xs uppercase tracking-[0.2em] no-underline" style={{ color: "var(--plum-soft)" }}>Privacy</Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="mt-24" style={{ borderTop: "1px solid rgba(201,122,140,0.3)", background: "rgba(248, 236, 224, 0.5)" }}>
        <div className="container py-12 grid md:grid-cols-3 gap-10">
          <div>
            <div className="editorial-serif text-2xl" style={{ color: "var(--plum-text)" }}>
              Perimenopause <span className="script" style={{ color: "var(--rose-deep)" }}>Panic</span>
            </div>
            <p className="text-sm mt-3" style={{ color: "var(--plum-soft)" }}>
              Edited and tended by The Oracle Lover. Soft, evidence-led, never patronising. A
              candle in the dark for the hormonal decade nobody warned you about.
            </p>
            <p className="text-xs mt-4" style={{ color: "var(--plum-soft)" }}>
              Editorial sister site of{" "}
              <a href="https://theoraclelover.com" rel="noopener" style={{ color: "var(--rose-deep)" }}>
                theoraclelover.com
              </a>
              .
            </p>
          </div>
          <div>
            <div className="ui-sans uppercase text-xs tracking-[0.22em] mb-3" style={{ color: "var(--mauve-deep)" }}>
              Wander Inside
            </div>
            <ul className="text-sm space-y-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="no-underline" style={{ color: "var(--plum-soft)" }}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="ui-sans uppercase text-xs tracking-[0.22em] mb-3" style={{ color: "var(--mauve-deep)" }}>
              Fine Print
            </div>
            <ul className="text-sm space-y-2">
              <li><Link href="/disclosures" className="no-underline" style={{ color: "var(--plum-soft)" }}>Disclosures</Link></li>
              <li><Link href="/privacy" className="no-underline" style={{ color: "var(--plum-soft)" }}>Privacy</Link></li>
              <li><Link href="/contact" className="no-underline" style={{ color: "var(--plum-soft)" }}>Contact</Link></li>
            </ul>
            <p className="text-xs mt-6" style={{ color: "var(--plum-soft)" }}>
              As an Amazon Associate we earn from qualifying purchases. Affiliate links are
              marked. Editorial selection is independent.
            </p>
          </div>
        </div>
        <div className="container py-6 text-xs" style={{ borderTop: "1px solid rgba(201,122,140,0.25)", color: "var(--plum-soft)" }}>
          © {new Date().getFullYear()} Perimenopause Panic · The Oracle Lover. Held with care.
        </div>
      </footer>
    </div>
  );
}
