// --- Railway crash diagnostics (MUST be the first executable lines) ---
// Any module loaded below this block may throw synchronously; we install handlers
// before any other code runs so failures show up in `railway logs`.
process.on("uncaughtException", err => {
  // eslint-disable-next-line no-console
  console.error("[FATAL uncaughtException]", err && (err.stack || err));
});
process.on("unhandledRejection", reason => {
  // eslint-disable-next-line no-console
  console.error(
    "[FATAL unhandledRejection]",
    reason instanceof Error ? reason.stack || reason.message : reason
  );
});
// ---------------------------------------------------------------------

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSiteRoutes } from "../siteRoutes";
import { startCronRunner } from "../cron";
import { wwwToApexRedirect } from "../middleware/wwwRedirect";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Server-level error handler (Railway lesson #4) — surfaces EADDRINUSE,
  // EACCES, and any other bind failures with a clear log line instead of a
  // silent process death.
  httpServer.on("error", err => {
    // eslint-disable-next-line no-console
    console.error("[FATAL httpServer.error]", err && ((err as Error).stack || err));
  });

  // FIRST middleware: WWW -> apex 301 (master scope §17)
  app.use(wwwToApexRedirect());
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // AEO + editorial site routes (robots, sitemap, llms, health, articles, SSR head)
  registerSiteRoutes(app);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // Railway lesson #5: default to 8080 in production (Railway's expected
  // default) instead of 10000. Dev still walks ports starting at 3000.
  const isProduction = process.env.NODE_ENV === "production";
  const defaultPort = isProduction ? 8080 : 3000;
  const preferredPort = parseInt(process.env.PORT || String(defaultPort), 10);
  // In production (Railway, Cloud Run, etc.) we MUST bind to the injected
  // PORT exactly. The dev sandbox uses port-walk so multiple sandboxes can
  // coexist.
  const port = isProduction ? preferredPort : await findAvailablePort(preferredPort);

  if (port !== preferredPort && !isProduction) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start in-process cron runner (gated by AUTO_GEN_ENABLED)
    startCronRunner();
  });
}

startServer().catch(err => {
  // eslint-disable-next-line no-console
  console.error("[FATAL startServer rejected]", err && (err.stack || err));
  process.exit(1);
});
