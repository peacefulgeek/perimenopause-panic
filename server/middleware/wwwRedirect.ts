import type { Request, Response, NextFunction } from "express";

/**
 * Master scope §17 — WWW -> apex 301 redirect.
 * MUST be the first middleware on the app, before anything else can write
 * to the response. Preserves the path and query string. HTTPS is preserved
 * (or upgraded) so the redirect chain ends at https://apex/...
 */
export function wwwToApexRedirect() {
  return function wwwToApex(req: Request, res: Response, next: NextFunction): void {
    const host = (req.headers.host || "").toLowerCase();
    if (host.startsWith("www.")) {
      const apex = host.slice(4);
      const proto =
        ((req.headers["x-forwarded-proto"] as string) || req.protocol || "https")
          .split(",")[0]
          .trim() || "https";
      const target = `${proto === "http" ? "https" : proto}://${apex}${req.originalUrl}`;
      res.redirect(301, target);
      return;
    }
    next();
  };
}
