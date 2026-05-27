import type { Express, Request, Response } from "express";
import {
  buildRobotsTxt,
  buildSitemapXml,
  buildLlmsTxt,
  buildLlmsFullTxt,
  articleJsonLd,
  homeOrgJsonLd,
  injectHead,
  canonicalLinkFor,
  tldrPreShell,
  escapeHtml,
} from "./lib/aeo";
import {
  listPublishedFromBunny,
  getArticleFromBunny,
  countByStatusFromBunny,
  type IndexEntry,
  type StoredArticle,
} from "./lib/articleStore";
import { recentCronRuns, publishedDailyCounts } from "./lib/articles";
import { SITE, publicBaseUrl } from "./lib/siteConfig";
import { auditBunnyMirror } from "./lib/bunnyMirrorHeal";
import { ASSESSMENTS, findAssessment } from "./lib/assessments";
import { HERBS, findHerb } from "./lib/herbs";

/**
 * Register every editorial site route. Order:
 *  1) /health
 *  2) /robots.txt
 *  3) /sitemap.xml
 *  4) /llms.txt and /llms-full.txt
 *  5) /api/diagnostics  (cron runs, db counts)
 *  6) HTML head injection for /articles/:slug and /
 *
 * The HTML head injection runs as middleware that intercepts the eventual
 * HTML response from Vite/serveStatic. We accomplish this by patching
 * res.send when the Content-Type is text/html.
 */
export function registerSiteRoutes(app: Express): void {
  // /health — DigitalOcean health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", site: SITE.name, ts: Date.now() });
  });

  // /robots.txt
  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.type("text/plain").send(buildRobotsTxt());
  });

  // /sitemap.xml
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    const xml = await buildSitemapXml();
    res.type("application/xml").send(xml);
  });

  // /llms.txt
  app.get("/llms.txt", async (_req: Request, res: Response) => {
    const txt = await buildLlmsTxt();
    res.type("text/markdown").send(txt);
  });
  app.get("/llms-full.txt", async (_req: Request, res: Response) => {
    const txt = await buildLlmsFullTxt();
    res.type("text/plain").send(txt);
  });

  // Public REST endpoints. Reads happen against Bunny CDN only — the
  // database is never touched on the public request path.
  app.get("/api/articles", async (_req: Request, res: Response) => {
    const list = await listPublishedFromBunny();
    res.json(list);
  });
  app.get("/api/articles/:slug", async (req: Request, res: Response) => {
    const a = await getArticleFromBunny(req.params.slug);
    if (!a) {
      res.status(404).json({ error: "not-found" });
      return;
    }
    res.json(a);
  });

  app.get("/api/assessments", (_req: Request, res: Response) => {
    res.json(
      ASSESSMENTS.map((a) => ({
        slug: a.slug,
        title: a.title,
        oneLiner: a.oneLiner,
        blurb: a.blurb,
        imageKey: a.imageKey,
        estimatedMinutes: a.estimatedMinutes,
      })),
    );
  });
  app.get("/api/assessments/:slug", (req: Request, res: Response) => {
    const a = findAssessment(req.params.slug);
    if (!a) return void res.status(404).json({ error: "not-found" });
    res.json(a);
  });

  app.get("/api/herbs", (_req: Request, res: Response) => {
    res.json(
      HERBS.map((h) => ({
        slug: h.slug,
        name: h.name,
        latin: h.latin,
        family: h.family,
        oneLiner: h.oneLiner,
        category: h.category,
      })),
    );
  });
  app.get("/api/herbs/:slug", (req: Request, res: Response) => {
    const h = findHerb(req.params.slug);
    if (!h) return void res.status(404).json({ error: "not-found" });
    res.json(h);
  });

  // Bunny mirror diagnostics — list any published article whose JSON
  // artifact is missing from the public CDN. HEAD-only, never modifies
  // anything. Safe to expose because the response only contains slugs
  // that are already public.
  app.get("/api/diagnostics/bunny-mirror", async (_req: Request, res: Response) => {
    try {
      const audit = await auditBunnyMirror();
      res.json(audit);
    } catch (err) {
      res.status(500).json({
        error: "audit-failed",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Diagnostics. Counts come from Bunny index.json (no DB). Cron runs and
  // daily series only render when a DB is configured — if not, they're
  // empty arrays. The public site never depends on either of them.
  app.get("/api/diagnostics", async (_req: Request, res: Response) => {
    const counts = await countByStatusFromBunny();
    let cron: any[] = [];
    let daily: any[] = [];
    if (process.env.DATABASE_URL) {
      try {
        [cron, daily] = await Promise.all([recentCronRuns(50), publishedDailyCounts()]);
      } catch {
        // best-effort; never block diagnostics on a DB hiccup
      }
    }
    res.json({
      counts,
      cron,
      daily,
      env: {
        AUTO_GEN_ENABLED: (process.env.AUTO_GEN_ENABLED || "true").toLowerCase() === "true",
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://api.deepseek.com",
        OPENAI_MODEL: process.env.OPENAI_MODEL || "deepseek-v4-pro",
        publicBaseUrl: publicBaseUrl(),
        runtimeStore: "bunny",
      },
    });
  });

  // HTML head injection — must run before Vite/serveStatic so we can wrap
  // res.send. Express middleware order takes care of this since this
  // function is called before setupVite/serveStatic in _core/index.ts.
  app.use(async (req, res, next) => {
    if (req.method !== "GET") return next();
    const origSend = res.send.bind(res);
    res.send = function patchedSend(body: any) {
      try {
        const ct = (res.getHeader("Content-Type") || "").toString();
        if (typeof body === "string" && ct.includes("text/html")) {
          return origSend(body); // already injected synchronously below
        }
      } catch {}
      return origSend(body);
    };
    // For /articles/:slug paths we precompute the head fragment and stash
    // it on res.locals so the HTML serving step can pick it up.
    const url = req.path;
    const apex = publicBaseUrl().replace(/\/$/, "");
    let injection = "";
    try {
      if (url.startsWith("/articles/") && url.length > "/articles/".length) {
        const slug = url.replace(/^\/articles\//, "").split("/")[0];
        const a = await getArticleFromBunny(slug);
        if (a) {
          const ogImg = a.heroUrl || `${SITE.bunny.pullZone}/library/lib-01.webp`;
          injection = [
            `<title>${escapeHtml(a.title)} — ${SITE.name}</title>`,
            `<meta name="description" content="${escapeHtml(a.metaDescription)}" />`,
            canonicalLinkFor(`/articles/${a.slug}`),
            `<meta property="og:type" content="article" />`,
            `<meta property="og:title" content="${escapeHtml(a.ogTitle)}" />`,
            `<meta property="og:description" content="${escapeHtml(a.ogDescription)}" />`,
            `<meta property="og:image" content="${ogImg}" />`,
            `<meta property="og:url" content="${apex}/articles/${a.slug}" />`,
            `<meta name="twitter:card" content="summary_large_image" />`,
            `<meta name="twitter:title" content="${escapeHtml(a.ogTitle)}" />`,
            `<meta name="twitter:description" content="${escapeHtml(a.ogDescription)}" />`,
            `<meta name="twitter:image" content="${ogImg}" />`,
            `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />`,
            articleJsonLd(a),
            tldrPreShell(a.tldr),
          ].join("\n");
        }
      } else if (url === "/" || url === "/articles" || url === "/about" || url === "/tools-we-recommend" || url === "/disclosures" || url === "/privacy" || url === "/contact" || url === "/assessments" || url.startsWith("/assessments/") || url === "/herbs" || url.startsWith("/herbs/")) {
        injection = [
          canonicalLinkFor(url || "/"),
          `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />`,
          homeOrgJsonLd(),
        ].join("\n");
      }
    } catch (e) {
      // never block the request because of head injection
      injection = "";
    }
    res.locals.headInjection = injection;
    next();
  });

  // Wrap the eventual HTML response. Vite (dev) and serveStatic (prod) both
  // call res.send/res.end with HTML; we patch end to insert into </head>.
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    const origEnd = res.end.bind(res) as any;
    res.end = function patchedEnd(chunk?: any, ...rest: any[]): any {
      try {
        const ct = (res.getHeader("Content-Type") || "").toString();
        if (
          chunk &&
          typeof chunk !== "function" &&
          ct.includes("text/html") &&
          res.locals.headInjection
        ) {
          let str = typeof chunk === "string" ? chunk : Buffer.isBuffer(chunk) ? chunk.toString("utf8") : "";
          if (str && str.includes("</head>")) {
            str = injectHead(str, res.locals.headInjection);
            res.setHeader("Content-Length", Buffer.byteLength(str));
            return origEnd(str, ...rest);
          }
        }
      } catch {}
      return origEnd(chunk, ...rest);
    };
    next();
  });
}
