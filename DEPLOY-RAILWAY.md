# Deploying Perimenopause Panic to Railway

This project deploys to Railway using **Railpack** (Railway's default builder). There is intentionally no Dockerfile and no `nixpacks.toml` — both caused builder conflicts in earlier rounds (Nixpacks injecting Caddy in front of Express, Dockerfile `CMD` vs `startCommand` ambiguity, and stale build caches). `railway.json` only sets a `startCommand`; Railpack auto-detects Node + pnpm from `package.json` (which pins `pnpm@10.4.1`). `Procfile` is retained as a harmless fallback for Heroku-style PaaS providers (Railway/Railpack ignore it; only `railway.json`'s `startCommand` is honored).

## 1. Create the service

1. Push the repo to GitHub (`peacefulgeek/perimenopause-panic`).
2. In Railway, **New Project → Deploy from GitHub repo** and select that repo.
3. Railway auto-detects Node + pnpm via Railpack and reads `railway.json` for the start command (`pnpm start`). There is no healthcheck configured at the Railway level — the server already exposes `/health` if you want to wire one manually in the dashboard, but the cold-start cron warm-up can exceed default healthcheck timeouts.

## 2. Provision a MySQL database

1. In the Railway project, **+ New → Database → MySQL**.
2. Once provisioned, copy the `MYSQL_URL` value from the database service's **Variables** tab.
3. In the **app service** **Variables** tab, add `DATABASE_URL` set to that same connection string.

## 3. Required environment variables

Paste the following into the app service's **Variables** tab exactly as listed. The block matches the canonical env contract for this site.

```
NODE_ENV="production"
AUTO_GEN_ENABLED="true"
AMAZON_TAG="spankyspinola-20"
JWT_SECRET="<96-char hex secret — see secret store>"
OPENAI_API_KEY="<DeepSeek API key — see secret store>"
OPENAI_BASE_URL="https://api.deepseek.com"
OPENAI_MODEL="deepseek-v4-pro"
FAL_KEY="<FAL key — see secret store>"
GH_PAT="<GitHub PAT — see secret store>"
```

Live secret values are kept out of the repo (GitHub secret-scanning enforces this). They live in the project's secret store (Railway Variables, plus the local skill `perimenopause-panic-bunny` for sandbox dev work).

The asterisks mark must-have variables; the rest have safe defaults.

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` * | `production` | Forces port-bind to `process.env.PORT` exactly (no port-walk) and switches Express to static-file serving. |
| `DATABASE_URL` * | `mysql://user:pass@host:port/db` | From the Railway MySQL plugin. |
| `JWT_SECRET` * | (provided in env block) | Used for cookie signing. Already set to a strong 96-char hex. |
| `OPENAI_API_KEY` * | (provided in env block) | DeepSeek key, consumed by the OpenAI client. |
| `OPENAI_BASE_URL` * | `https://api.deepseek.com` | DeepSeek host. |
| `OPENAI_MODEL` * | `deepseek-v4-pro` | Writing-engine model. |
| `AUTO_GEN_ENABLED` * | `true` | Set to `false` to silence the cron entirely. |
| `AMAZON_TAG` * | `spankyspinola-20` | Affiliate tag attached to every Amazon search-link in articles, herbs, and tools. |
| `FAL_KEY` | (provided in env block) | Reserved for image-generation jobs (FAL). The cron does not call FAL by default; this key is only consumed by ad-hoc imagery scripts. |
| `GH_PAT` | (provided in env block) | Used by repo-management scripts (push, release tagging). Not consumed by the running web service at runtime. |
| `PUBLISHED_CAP` | (unset) | Optional. Leave unset for **no cap** (the publisher will keep releasing queued items every scheduled slot indefinitely). Set to a positive integer if you ever want to re-introduce a ceiling without a code change. |
| `BUNNY_API_KEY` | (Bunny storage zone password) | Required for the cron to upload `articles/<slug>.json` and any new imagery to the `perimenopause` storage zone. Read-only browsing of `perimenopause.b-cdn.net` does **not** require this key. |
| `BUNNY_STORAGE_ZONE` | `perimenopause` | Storage zone name. Defaults are baked into `siteConfig.ts`; only override if you migrate. |
| `BUNNY_STORAGE_HOST` | `ny.storage.bunnycdn.com` | NY region storage host. |
| `BUNNY_PULL_ZONE` | `https://perimenopause.b-cdn.net` | Public CDN host for all images, fonts, and `articles/<slug>.json`. |
| `OWNER_OPEN_ID` | `peacefulgeek` | Marks the owner for any owner-only diagnostics. |
| `OWNER_NAME` | `The Oracle Lover` | Cosmetic. |
| `PORT` | (leave blank) | Railway injects this automatically; the server reads `process.env.PORT` and falls back to `8080` in production. |

## 4. Run the migrations

Once `DATABASE_URL` is set, open the Railway **Shell** for the app service and run:

```
pnpm tsx server/scripts/seed.ts
pnpm tsx server/scripts/seed500.ts
```

That will populate the initial 30 published articles, the 500 queued placeholders, and the 60-day backfilled cron history. The publisher cron will then continue to release queued items on its schedule (see §7), so the live counts will drift upward over time — at the time of this writing the live DB holds 33 published and 497 queued.

## 5. Wire the domain

In the app service **Settings → Networking → Custom Domain**, add `perimenopausepanic.com` and `www.perimenopausepanic.com`. Railway gives you a CNAME target. Point both records there at the registrar; the Express WWW-to-apex middleware does the rest.

## 6. Verify the deployment

- `https://perimenopausepanic.com/health` → `{"status":"ok"}`
- `https://www.perimenopausepanic.com/anything` → 301 to `https://perimenopausepanic.com/anything`
- `https://perimenopausepanic.com/sitemap.xml` → lists 7 static URLs + every published article slug
- `https://perimenopausepanic.com/robots.txt` → allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended
- `https://perimenopausepanic.com/api/articles` → every published article (33+ at time of writing; grows over time as the cron releases queued items)
- `https://perimenopausepanic.com/api/diagnostics` → cron history with multi-day distribution
- `https://perimenopause.b-cdn.net/articles/<slug>.json` → each published article is mirrored as a static JSON artifact on Bunny (auto-uploaded by the publisher cron, plus a one-shot `pnpm tsx server/scripts/backfillArticleJson.ts` to refresh the whole corpus on demand)

## 7. Publishing throughput

The 100-article cap has been removed. By default `PUBLISHED_CAP` is unset and the publisher runs without a ceiling, releasing one queued article per scheduled slot for as long as the queue has items (the queue started at 500; live counts drift over time as the cron releases items). Today's schedule is five fires per day in phase 1 (07:00, 10:00, 13:00, 16:00, 19:00 UTC) and once weekday at 08:00 UTC in phase 2 — the corpus crosses into phase 2 at 60 published articles.

If you ever need to throttle again, set `PUBLISHED_CAP` to a positive integer in Railway Variables. The cron checks `Number.isFinite(PUBLISHED_CAP)` before enforcing it, so the env-driven cap is fully optional.
