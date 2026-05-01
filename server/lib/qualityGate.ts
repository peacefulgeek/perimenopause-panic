/**
 * Master scope §12 + §14A — quality gate. Banned words/phrases (union of
 * every list across the input documents), em/en-dash zero tolerance, voice
 * signals, EEAT signals (TL;DR, byline, datetime, internal links, external
 * authoritative link, self-reference).
 */
export const AI_FLAGGED_WORDS: string[] = [
  "delve",
  "tapestry",
  "leverage",
  "unlock",
  "empower",
  "furthermore",
  "moreover",
  "utilize",
  "utilise",
  "underscore",
  "paramount",
  "seamlessly",
  "seamless",
  "robust",
  "beacon",
  "foster",
  "elevate",
  "curate",
  "curated",
  "bespoke",
  "resonate",
  "harness",
  "intricate",
  "plethora",
  "myriad",
  "groundbreaking",
  "innovative",
  "cutting-edge",
  "state-of-the-art",
  "game-changer",
  "game-changing",
  "ever-evolving",
  "rapidly-evolving",
  "stakeholders",
  "paradigm",
  "synergy",
  "pivotal",
  "embark",
  "profound",
  "transformative",
  "holistic",
  "nuanced",
  "multifaceted",
];

export const AI_FLAGGED_PHRASES: string[] = [
  "in conclusion,",
  "in summary,",
  "in today's fast-paced world",
  "in today's digital age",
  "it's important to note that",
  "it's worth noting that",
  "it's crucial to",
  "in the realm of",
  "a holistic approach",
  "unlock your potential",
  "dive deep into",
  "at the end of the day",
  "move the needle",
  "it goes without saying",
  "plays a crucial role",
  "in our fast-paced",
];

export interface GateFailure {
  rule: string;
  detail?: string;
}

export interface GateResult {
  ok: boolean;
  failures: GateFailure[];
}

const SELF_REF_RE =
  /\b(in our experience|when (we|i) tested|on this site|across our|across the dozens of articles we['']ve published|i['']ve seen|in my own practice|over the years|after years of)\b/i;

export function runQualityGate(input: {
  body: string;
  wordCount: number;
}): GateResult {
  const failures: GateFailure[] = [];
  const body = input.body;
  const lower = body.toLowerCase();

  // 1. Word count window
  if (input.wordCount < 1200 || input.wordCount > 2500) {
    failures.push({
      rule: "word-count-out-of-range",
      detail: `wordCount=${input.wordCount}`,
    });
  }

  // 2. Em/en-dash zero tolerance
  if (body.includes("\u2014") || body.includes("\u2013")) {
    failures.push({ rule: "em-or-en-dash" });
  }

  // 3. Banned words
  for (const w of AI_FLAGGED_WORDS) {
    const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (re.test(body)) failures.push({ rule: "banned-word", detail: w });
  }

  // 4. Banned phrases
  for (const p of AI_FLAGGED_PHRASES) {
    if (lower.includes(p)) failures.push({ rule: "banned-phrase", detail: p });
  }

  // 5. EEAT TL;DR section
  if (!/data-tldr=["']ai-overview["']/.test(body)) {
    failures.push({ rule: "eeat-missing-tldr" });
  }

  // 6. Author byline block
  if (!/author-byline/.test(body)) {
    failures.push({ rule: "eeat-missing-byline" });
  }

  // 7. Datetime in byline
  if (!/<time\s+datetime=["']\d{4}-\d{2}-\d{2}/i.test(body)) {
    failures.push({ rule: "eeat-missing-last-updated" });
  }

  // 8. Self-reference
  if (!SELF_REF_RE.test(body)) {
    failures.push({ rule: "voice-missing-self-reference" });
  }

  // 9. Internal links — at least 3 to /articles/
  const internal = (body.match(/href=["']\/articles\/[a-z0-9-]+/g) || []).length;
  if (internal < 3) {
    failures.push({ rule: "eeat-missing-internal-links", detail: `count=${internal}` });
  }

  // 10. External authoritative outbound link — .gov/.edu/NIH/CDC/WHO/Nature/PubMed
  const externalRe =
    /href=["']https?:\/\/[^"']*?(\.gov|\.edu|nih\.gov|cdc\.gov|who\.int|nature\.com|pubmed|sciencedirect|menopause\.org|nejm\.org|jamanetwork\.com|bmj\.com|thelancet\.com)/i;
  if (!externalRe.test(body)) {
    failures.push({ rule: "eeat-missing-external-authoritative" });
  }

  // 11. Amazon links 3-4 with the affiliate tag (legacy /dp/ OR current /s? form)
  const amazonMatches =
    body.match(/href=["']https?:\/\/www\.amazon\.com\/(?:dp\/[A-Z0-9]+\?tag=spankyspinola-20|s\?k=[^"']+&(?:amp;)?tag=spankyspinola-20)/g) || [];
  if (amazonMatches.length < 3 || amazonMatches.length > 4) {
    failures.push({
      rule: "amazon-links-out-of-range",
      detail: `count=${amazonMatches.length}`,
    });
  }
  if (!/\(paid link\)/i.test(body)) {
    failures.push({ rule: "amazon-missing-paid-link-disclosure" });
  }

  // 12. Author leakage (Oracle Lover site -> no Paul / Krishna / Kalesh / Shrikrishna)
  if (/paul wagner|paulwagner|paul\.wagner|shrikrishna|kalesh\.love|kalesh /i.test(body)) {
    failures.push({ rule: "author-leakage" });
  }

  return { ok: failures.length === 0, failures };
}

export function countWordsFromHtml(body: string): number {
  const text = body
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}
