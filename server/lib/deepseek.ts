import OpenAI from "openai";

/**
 * DeepSeek wrapper using the OpenAI SDK pointed at api.deepseek.com.
 *
 * Security: the API key is read ONLY from `process.env.OPENAI_API_KEY`. There
 * is no hard-coded fallback. If the env var is missing, every call throws a
 * clear error at first use, so a misconfigured deploy fails fast instead of
 * silently leaking a stale literal key.
 *
 * `baseURL` and `model` keep code defaults (api.deepseek.com / deepseek-v4-pro)
 * because they are not secrets — they describe which provider/model to call.
 */
const baseURL = process.env.OPENAI_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.OPENAI_MODEL || "deepseek-v4-pro";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Refusing to call the LLM without a real key.",
    );
  }
  if (!_client) {
    _client = new OpenAI({ apiKey, baseURL });
  }
  return _client;
}

/** Back-compat export. Lazily resolves; throws if env is missing. */
export const client = {
  get chat() {
    return getClient().chat;
  },
};

export async function callDeepSeek(opts: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature: opts.temperature ?? 0.72,
  });
  return res.choices[0]?.message?.content ?? "";
}
