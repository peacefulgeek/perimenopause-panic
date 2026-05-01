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
