# Perimenopause Panic — TODO

## Infrastructure
- [x] Drizzle schema: articles, cron_runs
- [x] WWW → apex 301 first middleware
- [x] /health endpoint
- [x] /robots.txt with GPTBot, ClaudeBot, PerplexityBot, Google-Extended
- [x] /sitemap.xml
- [x] /llms.txt and /llms-full.txt
- [x] SSR canonical + JSON-LD pre-React
- [x] Bunny CDN assignHeroImage helper
- [x] DeepSeek (OpenAI client) writing engine
- [x] Quality gate (banned words/phrases, em-dash, voice, EEAT)
- [x] Internal-link picker
- [x] node-cron runner (5x/day publisher, weekly product spotlight, monthly + quarterly refresh, ASIN health)
- [x] AUTO_GEN_ENABLED gating
- [x] Author leakage grep (no Paul, no Krishna, no Kalesh, no Shrikrishna)

## Frontend
- [x] Broadsheet color tokens (warm cream, deep brown, terra cotta, blush)
- [x] Cormorant + Nunito Sans + Inter via Bunny WOFF2 (with system-stack fallback)
- [x] Home — editorial grid, no hero image, image-rich card layout
- [x] Article list page
- [x] Article detail — drop-cap, pull quotes, sticky TOC, TL;DR, byline
- [x] Tools We Recommend / Hormone Health Library
- [x] About (The Oracle Lover)
- [x] Privacy Policy
- [x] Disclosures
- [x] Contact

## Content
- [x] 30 seeded published articles (1,200-2,500 words each), spread across past 14 days
- [x] Each article: TL;DR, byline w/ datetime, ≥3 internal links, ≥1 .gov/.edu external, 3-4 Amazon links w/ (paid link), self-reference line
- [x] 23% backlink to theoraclelover.com with varied anchor text

## Verification
- [x] vitest covering quality gate + redirect + robots/sitemap routes
- [x] DB queries for word-count, em-dash, EEAT, leakage all return 0
- [x] Cron runs table shows multi-day publish history

## Round 2 — Redesign + content explosion
- [ ] Re-palette to cream/rose/mauve/lavender (no brown, no black, no red)
- [ ] Watercolor texture backgrounds + soft motion + serif/script display type
- [ ] Generate ~40 watercolor library images (consistent style)
- [ ] Watercolor hero on EVERY published article
- [ ] /assessments — 11 nurturing self-assessments with watercolor cards + scoring
- [ ] /herbs — 200+ herbs/TCM/supplements, watercolor thumbnail, 3-sentence write-up, verified spankyspinola-20 ASIN
- [ ] Pre-seed 500 QUEUED articles 1,800+ words each in author voice
- [ ] Verify only ~30 published, rest queued, daily cron will release them
- [ ] Confirm node-cron in-process, no Manus scheduler dependency
- [ ] Confirm zero Manus runtime: no /manus-storage/, no manus-cdn, no manus-tide
- [ ] Migrate any Manus-hosted assets to Bunny CDN (or leave as deterministic Bunny URLs and document that the upload is the only outstanding step)
- [ ] Final §23 report + commit hash + screenshot
