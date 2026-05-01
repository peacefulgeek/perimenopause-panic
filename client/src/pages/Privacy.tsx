import { SiteShell } from "@/components/SiteShell";

export default function Privacy() {
  return (
    <SiteShell>
      <section className="container py-10 article-prose">
        <div className="badge-category">Fine Print</div>
        <h1 className="editorial-serif mt-4">Privacy policy</h1>
        <p>
          Perimenopause Panic is published by The Oracle Lover. We collect the
          minimum data needed to serve and improve the site. We do not sell
          data. We do not run third-party advertising networks. The only
          analytics we use is privacy-respecting, aggregate-only, and stores
          no personally identifiable data on our visitors.
        </p>
        <h2>What we collect</h2>
        <p>
          When you visit a page, our hosting provider records standard server
          logs, including IP address, request path, status code, and user
          agent. These are retained for thirty days and rotated. We do not
          set tracking cookies. We do not use cross-site identifiers.
        </p>
        <h2>Affiliate links</h2>
        <p>
          When you click a link marked <em>(paid link)</em>, you are sent to
          an Amazon product page using our affiliate identifier. Amazon may
          set cookies on its own domain. We never see those cookies. Your
          browsing on Amazon is governed by Amazon&apos;s privacy policy.
        </p>
        <h2>Email</h2>
        <p>
          If you write to us through the contact form, we use Nodemailer to
          send the message to our editorial inbox. We retain correspondence
          for as long as is needed to respond, then delete it.
        </p>
        <h2>Children</h2>
        <p>
          The site is intended for adults. We do not knowingly collect data
          from anyone under sixteen.
        </p>
        <h2>Contact</h2>
        <p>
          For privacy questions, write to us via the{" "}
          <a href="/contact">contact page</a>. We try to reply within seven
          working days.
        </p>
      </section>
    </SiteShell>
  );
}
