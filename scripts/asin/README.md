# Verified-ASIN module

Self-contained, zero-dependency Node 18+ utility that audits every Amazon
ASIN referenced by the site, swaps out anything that is dead, and writes
back a clean `server/lib/herbs.ts` and `server/lib/affiliate.ts`.

It runs from your laptop because Amazon's bot wall blocks our build
sandbox. From a normal residential IP every page loads cleanly.

## One command

```bash
cd perimenopause-panic
node scripts/asin/run.mjs
```

That command will:

1. Read every ASIN from `server/lib/herbs.ts` and `server/lib/affiliate.ts`.
2. GET each one three times against `https://www.amazon.com/dp/<ASIN>?tag=spankyspinola-20`, with real browser headers and 1.5s+ jitter between attempts.
3. Parse the live `<title>` and the body for the "Looking for something?" interstitial. A page is **verified** only when at least one of the three GETs returns a real product page whose title contains an expected keyword for that herb (e.g. an ashwagandha entry must have "ashwagandha" in the title).
4. For every entry that fails verification, walk a curated swap pool (Pure Encapsulations, Nature's Way, NOW Foods, Solgar, Thorne, Gaia Herbs, Jarrow, Doctor's Best) and pick the first candidate that verifies the same way.
5. Write the corrected ASINs back to `server/lib/herbs.ts` and `server/lib/affiliate.ts` in place. The diff is shown.
6. Emit a final `scripts/asin/report.csv` with `asin,source,name,verdict,p1,p2,p3,replacement,detail`.

Re-runs are idempotent: if a file is already clean, nothing changes.

## Flags

| Flag           | Effect                                                        |
| -------------- | ------------------------------------------------------------- |
| `--dry-run`    | Don't write files; just emit `report.csv`. Default is `--write`. |
| `--limit=N`    | Only process the first N ASINs (handy for spot-checks).       |
| `--only=herbs` | Restrict to `server/lib/herbs.ts` (skip the catalog).          |
| `--only=catalog` | Restrict to `server/lib/affiliate.ts`.                       |

## After it runs

The script prints a one-line summary like:

```
[asin] 242 ASINs   verified=242   swapped=110   manual=0   report=scripts/asin/report.csv
```

If `manual` is greater than zero, those entries had no swap-pool candidate
that passed verification. They are listed at the top of `report.csv` for
hand-picking. The site code already renders unverified entries with no
affiliate link and a "verifying" badge, so nothing broken ships to users.

## Architecture

```
scripts/asin/
├── README.md             ← this file
├── run.mjs               ← entrypoint (zero deps, just node)
├── verifier.mjs          ← GET + title parse + 3-pass logic
├── swap-pool.mjs         ← curated Tier-1 brand candidates per herb
└── files.mjs             ← read/write of herbs.ts and affiliate.ts in place
```

The runtime in `server/` does not depend on any of this — it's a tooling
script. Once it has updated `herbs.ts` and `affiliate.ts`, the next
`pnpm build` ships the verified ASINs.
