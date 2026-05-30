import { describe, it, expect } from "vitest";
/**
 * Smoke test the CLAUDE_API_KEY by calling the Anthropic /v1/messages
 * endpoint with the smallest legal payload. The test is skipped when
 * CLAUDE_API_KEY is not present (e.g. CI environments without secrets)
 * so it never breaks unrelated test runs.
 */
describe("CLAUDE_API_KEY", () => {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) {
    it.skip("skipped — CLAUDE_API_KEY not set in this env", () => {});
    return;
  }
  it("authenticates against Anthropic and returns a 200 with content", async () => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8,
        messages: [{ role: "user", content: "Reply with the single word: ok" }],
      }),
    });
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(Array.isArray(json.content)).toBe(true);
    expect(typeof json.content[0]?.text).toBe("string");
  }, 30_000);
});
