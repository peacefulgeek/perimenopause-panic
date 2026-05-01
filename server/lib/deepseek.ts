import OpenAI from "openai";

const apiKey =
  process.env.OPENAI_API_KEY || "sk-82bdad0a1fd34987b73030504ae67080";
const baseURL = process.env.OPENAI_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.OPENAI_MODEL || "deepseek-v4-pro";

export const client = new OpenAI({ apiKey, baseURL });

export async function callDeepSeek(opts: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature: opts.temperature ?? 0.72,
  });
  return res.choices[0]?.message?.content ?? "";
}
