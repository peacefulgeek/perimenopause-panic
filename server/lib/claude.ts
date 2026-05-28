/**
 * Anthropic Claude client.
 *
 * Used for all article generation, quarterly/monthly refresh rewrites, and any
 * future Claude-backed tooling on the server side. The key is read ONLY from
 * `process.env.CLAUDE_API_KEY` (or `ANTHROPIC_API_KEY` as a fallback alias).
 * No hard-coded fallback, so a misconfigured deploy fails fast instead of
 * silently calling the wrong model with the wrong credentials.
 */

const DEFAULT_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";

function getKey(): string {
  const k = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!k) {
    throw new Error(
      "CLAUDE_API_KEY (or ANTHROPIC_API_KEY) is not set. Refusing to call Claude without a real key.",
    );
  }
  return k;
}

export interface ClaudeOpts {
  system: string;
  user: string;
  /** 0..1, default 0.7 */
  temperature?: number;
  /** Cap on response tokens. Default 8192 - enough for a 2,200-word article. */
  maxTokens?: number;
  /** Override model (otherwise uses CLAUDE_MODEL env or claude-sonnet-4-6). */
  model?: string;
}

export async function callClaude(opts: ClaudeOpts): Promise<string> {
  const apiKey = getKey();
  const body = {
    model: opts.model || DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 8192,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  };
  const r = await fetch(ANTHROPIC_BASE, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Claude API ${r.status}: ${text.slice(0, 400)}`);
  }
  const json: any = await r.json();
  // Anthropic returns content as an array of blocks; concatenate any text blocks.
  const blocks = Array.isArray(json?.content) ? json.content : [];
  const out = blocks
    .filter((b: any) => b?.type === "text" && typeof b.text === "string")
    .map((b: any) => b.text as string)
    .join("");
  return out || "";
}

/** Convenience for tests: a minimal "is the key alive" check. */
export async function pingClaude(): Promise<{ ok: boolean; model: string; error?: string }> {
  try {
    const txt = await callClaude({
      system: "You answer in a single short word.",
      user: "Reply with exactly the word: pong",
      maxTokens: 10,
      temperature: 0,
    });
    const ok = /pong/i.test(txt);
    return { ok, model: DEFAULT_MODEL };
  } catch (e: any) {
    return { ok: false, model: DEFAULT_MODEL, error: String(e?.message ?? e) };
  }
}
