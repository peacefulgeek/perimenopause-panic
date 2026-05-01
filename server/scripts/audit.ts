/**
 * Pure DB audit: read every published article body and assert ZERO
 * violations across the master-scope quality criteria. Output is a
 * single block of "metric: violations" lines plus the totals.
 *
 * Uses the same runQualityGate() that the production cron uses, so the
 * audit and the gate cannot drift apart.
 */
import "dotenv/config";
import { listPublishedArticles } from "../lib/articles";
import { runQualityGate, AI_FLAGGED_WORDS, AI_FLAGGED_PHRASES } from "../lib/qualityGate";

interface AuditCounters {
  emDash: number;
  enDash: number;
  bannedWord: number;
  bannedPhrase: number;
  missingTldr: number;
  missingByline: number;
  missingDatetime: number;
  authorLeakage: number;
  selfRefMissing: number;
  externalAuthMissing: number;
  internalLessThan3: number;
  amazonOutOfRange: number;
  wordCountOutOfRange: number;
  noOracleBacklink: number;
  totalArticles: number;
  totalNonAmazonExternal: number;
  totalOracleBacklinks: number;
}

function countMatches(s: string, re: RegExp): number {
  return (s.match(re) || []).length;
}

async function main() {
  const all = await listPublishedArticles(500);
  const c: AuditCounters = {
    emDash: 0,
    enDash: 0,
    bannedWord: 0,
    bannedPhrase: 0,
    missingTldr: 0,
    missingByline: 0,
    missingDatetime: 0,
    authorLeakage: 0,
    selfRefMissing: 0,
    externalAuthMissing: 0,
    internalLessThan3: 0,
    amazonOutOfRange: 0,
    wordCountOutOfRange: 0,
    noOracleBacklink: 0,
    totalArticles: all.length,
    totalNonAmazonExternal: 0,
    totalOracleBacklinks: 0,
  };

  const offenders: string[] = [];

  for (const a of all) {
    const body: string = a.body || "";
    const wc = a.wordCount || 0;

    // Run the master quality gate
    const gate = runQualityGate({ body, wordCount: wc });
    if (!gate.ok) {
      offenders.push(
        `${a.slug}: ${gate.failures.map((f) => f.rule + (f.detail ? ":" + f.detail : "")).join(", ")}`,
      );
    }

    if (countMatches(body, /\u2014/g) > 0) c.emDash++;
    if (countMatches(body, /\u2013/g) > 0) c.enDash++;

    const lower = body.toLowerCase();
    for (const w of AI_FLAGGED_WORDS) {
      if (new RegExp(`\\b${w}\\b`, "i").test(body)) {
        c.bannedWord++;
        break;
      }
    }
    for (const p of AI_FLAGGED_PHRASES) {
      if (lower.includes(p)) {
        c.bannedPhrase++;
        break;
      }
    }

    if (!body.includes('data-tldr="ai-overview"')) c.missingTldr++;
    if (!body.includes("author-byline") && !body.includes("Reviewed by"))
      c.missingByline++;
    if (!/<time[^>]*datetime=/.test(body)) c.missingDatetime++;

    if (
      /paul\s*wagner/i.test(body) ||
      /krishna/i.test(body) ||
      /kalesh/i.test(body) ||
      /shrikrishna/i.test(body)
    )
      c.authorLeakage++;

    if (
      !/in our experience|in my own practice|across the dozens|after years of working|over the years/i.test(
        body,
      )
    )
      c.selfRefMissing++;

    const externalLinks = Array.from(body.matchAll(/href="(https?:\/\/[^"]+)"/g)).map(
      (m) => m[1],
    );
    const nonAmazonExt = externalLinks.filter(
      (u) => !u.includes("amazon."),
    );
    c.totalNonAmazonExternal += nonAmazonExt.length;

    const hasAuth = nonAmazonExt.some((u) =>
      /(\.gov|\.edu|nih\.gov|menopause\.org|nice\.org\.uk|cdc\.gov|nhs\.uk|acog\.org|endocrine\.org)/i.test(
        u,
      ),
    );
    if (!hasAuth) c.externalAuthMissing++;

    const internal = Array.from(body.matchAll(/href="\/articles\/[^"]+"/g));
    if (internal.length < 3) c.internalLessThan3++;

    const amazon = externalLinks.filter((u) => u.includes("amazon.com/dp/"));
    if (amazon.length < 3 || amazon.length > 5) c.amazonOutOfRange++;

    if (wc < 1200 || wc > 2500) c.wordCountOutOfRange++;

    const oracleLinks = nonAmazonExt.filter((u) =>
      /theoraclelover\.com/i.test(u),
    );
    c.totalOracleBacklinks += oracleLinks.length;
    if (oracleLinks.length < 1) c.noOracleBacklink++;
  }

  console.log("\n=== DB AUDIT — published articles ===");
  console.log(`  total articles:             ${c.totalArticles}`);
  console.log(`  em-dash violations:         ${c.emDash}`);
  console.log(`  en-dash violations:         ${c.enDash}`);
  console.log(`  banned-word violations:     ${c.bannedWord}`);
  console.log(`  banned-phrase violations:   ${c.bannedPhrase}`);
  console.log(`  missing TL;DR:              ${c.missingTldr}`);
  console.log(`  missing byline:             ${c.missingByline}`);
  console.log(`  missing <time> datetime:    ${c.missingDatetime}`);
  console.log(`  author leakage:             ${c.authorLeakage}`);
  console.log(`  missing self-ref opener:    ${c.selfRefMissing}`);
  console.log(`  missing authoritative ext.: ${c.externalAuthMissing}`);
  console.log(`  internal links <3:          ${c.internalLessThan3}`);
  console.log(`  amazon links not 3-5:       ${c.amazonOutOfRange}`);
  console.log(`  word count out of 1200-2500:${c.wordCountOutOfRange}`);
  console.log(`  no oracle backlink:         ${c.noOracleBacklink}`);
  console.log(
    `  oracle backlink ratio:      ${c.totalOracleBacklinks}/${c.totalNonAmazonExternal} = ${(
      (c.totalOracleBacklinks / Math.max(1, c.totalNonAmazonExternal)) *
      100
    ).toFixed(1)}% of non-amazon external links`,
  );
  if (offenders.length) {
    console.log("\n  Quality-gate offenders:");
    for (const o of offenders) console.log(`    ${o}`);
  }

  // Hard pass/fail flag
  const violations =
    c.emDash +
    c.enDash +
    c.bannedWord +
    c.bannedPhrase +
    c.missingTldr +
    c.missingByline +
    c.missingDatetime +
    c.authorLeakage +
    c.selfRefMissing +
    c.externalAuthMissing +
    c.internalLessThan3 +
    c.amazonOutOfRange +
    c.wordCountOutOfRange +
    c.noOracleBacklink +
    offenders.length;
  console.log(`\n  TOTAL VIOLATIONS: ${violations}`);
  process.exit(violations === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("[audit] FAILED:", e);
  process.exit(2);
});
