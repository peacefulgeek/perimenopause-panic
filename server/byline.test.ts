import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf-8");
}

describe("Oracle Lover identity is visible across the site", () => {
  const about = read("client/src/pages/About.tsx");
  const articleDetail = read("client/src/pages/ArticleDetail.tsx");
  const articles = read("client/src/pages/Articles.tsx");

  it("About page links to theoraclelover.com at least 3 times", () => {
    const count = (about.match(/theoraclelover\.com/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it("About page mentions The Oracle Lover by name", () => {
    expect(about).toMatch(/The Oracle Lover/);
  });

  it("About page declares editorial principles", () => {
    expect(about).toMatch(/Editorial principles|principles/i);
  });

  it("Article detail renders the byline with author and theoraclelover.com link", () => {
    expect(articleDetail).toMatch(/data\.author/);
    expect(articleDetail).toMatch(/theoraclelover\.com/);
  });

  it("Articles list cards include a real anchor to theoraclelover.com", () => {
    expect(articles).toMatch(/href="https:\/\/theoraclelover\.com"/);
    expect(articles).toMatch(/The Oracle Lover/);
  });
});
