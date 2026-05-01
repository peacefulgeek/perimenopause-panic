import { describe, it, expect } from "vitest";
import { wwwToApexRedirect } from "./middleware/wwwRedirect";
import type { Request, Response } from "express";

function mockReq(host: string, url: string, proto = "https"): Partial<Request> {
  return {
    headers: { host, "x-forwarded-proto": proto },
    protocol: proto,
    originalUrl: url,
  } as Partial<Request>;
}

function mockRes() {
  const captured: { code?: number; loc?: string } = {};
  const res = {
    redirect: (code: number, loc: string) => {
      captured.code = code;
      captured.loc = loc;
    },
  } as unknown as Response;
  return { res, captured };
}

describe("wwwToApexRedirect", () => {
  it("301-redirects www host to bare apex over https", () => {
    const mw = wwwToApexRedirect();
    const { res, captured } = mockRes();
    mw(
      mockReq("www.perimenopausepanic.com", "/articles/x") as Request,
      res,
      () => {
        throw new Error("next() should NOT be called");
      },
    );
    expect(captured.code).toBe(301);
    expect(captured.loc).toBe("https://perimenopausepanic.com/articles/x");
  });

  it("forces https even if x-forwarded-proto is http", () => {
    const mw = wwwToApexRedirect();
    const { res, captured } = mockRes();
    mw(
      mockReq("www.perimenopausepanic.com", "/", "http") as Request,
      res,
      () => {
        throw new Error("next() should NOT be called");
      },
    );
    expect(captured.loc?.startsWith("https://")).toBe(true);
  });

  it("calls next() for the apex host (no redirect loop)", () => {
    const mw = wwwToApexRedirect();
    const { res, captured } = mockRes();
    let nextCalled = false;
    mw(
      mockReq("perimenopausepanic.com", "/") as Request,
      res,
      () => {
        nextCalled = true;
      },
    );
    expect(nextCalled).toBe(true);
    expect(captured.code).toBeUndefined();
  });
});
