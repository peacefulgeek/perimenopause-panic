import { useState } from "react";
import { SiteShell } from "@/components/SiteShell";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | "ok" | "err">(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSent(null);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!r.ok) throw new Error("send failed");
      setSent("ok");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setSent("err");
    } finally {
      setSending(false);
    }
  }

  return (
    <SiteShell>
      <section className="container py-10">
        <div className="badge-category">Contact</div>
        <h1 className="editorial-serif mt-4">Write to us.</h1>
        <p className="mt-4 max-w-xl text-[var(--brown-soft)]">
          Editorial questions, corrections, story tips, or recommendations
          for the shelf. We answer real letters first.
        </p>
        <form onSubmit={submit} className="mt-8 max-w-xl space-y-5">
          <div>
            <label className="block ui-sans uppercase text-xs tracking-[0.18em] mb-1 text-[var(--brown-soft)]">Your name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-[var(--cream)] border border-[var(--brown)] px-3 py-2 ui-sans text-sm" />
          </div>
          <div>
            <label className="block ui-sans uppercase text-xs tracking-[0.18em] mb-1 text-[var(--brown-soft)]">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[var(--cream)] border border-[var(--brown)] px-3 py-2 ui-sans text-sm" />
          </div>
          <div>
            <label className="block ui-sans uppercase text-xs tracking-[0.18em] mb-1 text-[var(--brown-soft)]">Message</label>
            <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required className="w-full bg-[var(--cream)] border border-[var(--brown)] px-3 py-2 ui-sans text-sm" />
          </div>
          <button type="submit" disabled={sending} className="button-editorial">
            {sending ? "Sending..." : "Send"}
          </button>
          {sent === "ok" && (
            <p className="text-sm text-[var(--terra-deep)]">Thanks. We will get back to you.</p>
          )}
          {sent === "err" && (
            <p className="text-sm text-[var(--destructive)]">Sorry, the message did not go through. Try again later.</p>
          )}
        </form>
      </section>
    </SiteShell>
  );
}
