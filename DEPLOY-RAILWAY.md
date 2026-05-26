# Deploying Perimenopause Panic to Railway

This project ships with a Dockerfile, a Procfile, a `railway.json`, and a `nixpacks.toml`. Railway will use the Dockerfile by default; the others are fallbacks.

## 1. Create the service

1. Push the repo to GitHub (`peacefulgeek/perimenopause-panic`).
2. In Railway, **New Project → Deploy from GitHub repo** and select that repo.
3. Railway detects the `Dockerfile` and `railway.json` automatically. The healthcheck path is `/health`.

## 2. Provision a MySQL database

1. In the Railway project, **+ New → Database → MySQL**.
2. Once provisioned, copy the `MYSQL_URL` value from the database service's **Variables** tab.
3. In the **app service** **Variables** tab, add `DATABASE_URL` set to that same connection string.

## 3. Required environment variables

Paste the following into the app service's **Variables** tab. The asterisks mark must-have variables; the rest have safe defaults.

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` * | `mysql://user:pass@host:port/db` | From the Railway MySQL plugin. |
| `OPENAI_API_KEY` * | `sk-82bdad0a1fd34987b73030504ae67080` | DeepSeek key (used through the OpenAI client). |
| `OPENAI_BASE_URL` | `https://api.deepseek.com` | Default. |
| `OPENAI_MODEL` | `deepseek-v4-pro` | Default. |
| `AUTO_GEN_ENABLED` | `true` | Set to `false` to silence the cron entirely. |
| `PUBLISHED_CAP` | `100` | Hard ceiling on published articles. The cron stops releasing new pieces when reached. |
| `JWT_SECRET` * | random 32-byte hex | Used for cookie signing. |
| `BUNNY_STORAGE_ZONE` | `perimenopause` | The storage zone you already created. |
| `BUNNY_STORAGE_ENDPOINT` | `https://ny.storage.bunnycdn.com` | NY region. |
| `BUNNY_STORAGE_API_KEY` | (your Bunny storage password) | Only needed if the cron uploads new images. |
| `BUNNY_PULL_ZONE` | `perimenopause.b-cdn.net` | Read-only public asset host. |
| `OWNER_OPEN_ID` | `peacefulgeek` | Used to mark the owner. |
| `OWNER_NAME` | `The Oracle Lover` | Cosmetic. |
| `PORT` | (leave blank) | Railway injects this automatically; the server reads `process.env.PORT`. |

## 4. Run the migrations

Once `DATABASE_URL` is set, open the Railway **Shell** for the app service and run:

```
pnpm tsx server/scripts/seed.ts
pnpm tsx server/scripts/seed500.ts
```

That will populate the 30 published articles, the 500 queued placeholders, and the 60-day backfilled cron history.

## 5. Wire the domain

In the app service **Settings → Networking → Custom Domain**, add `perimenopausepanic.com` and `www.perimenopausepanic.com`. Railway gives you a CNAME target. Point both records there at the registrar; the Express WWW-to-apex middleware does the rest.

## 6. Verify the deployment

- `https://perimenopausepanic.com/health` → `{"status":"ok"}`
- `https://www.perimenopausepanic.com/anything` → 301 to `https://perimenopausepanic.com/anything`
- `https://perimenopausepanic.com/sitemap.xml` → lists 7 static URLs + every published article slug
- `https://perimenopausepanic.com/robots.txt` → allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended
- `https://perimenopausepanic.com/api/articles` → 30 published articles
- `https://perimenopausepanic.com/api/diagnostics` → cron history with multi-day distribution

## 7. Publish cap

The cron will only release queued articles up to `PUBLISHED_CAP` (default `100`). Today the corpus has 30 published and 500 queued, so the publisher will release one article per scheduled slot until it hits 100, then stop. To raise the ceiling later, just bump `PUBLISHED_CAP`.
