// Zero-dep, Node 18+ Amazon ASIN verifier.
// Public API:
//   verifyAsin(asin, expectKeywords[, opts])  -> { ok, status, title, detail }
//   verifyAsinTriple(asin, expectKeywords[, opts]) -> { verdict, passes }

const TAG = process.env.AMAZON_TAG || "spankyspinola-20";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (a, b) => a + Math.random() * (b - a);

function parseTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return "";
  return m[1].replace(/\s+/g, " ").trim();
}

function looksLikeNotFound(html, title) {
  // Amazon's "Looking for something?" interstitial.
  if (/Looking for something\?/i.test(html)) return true;
  if (/We're sorry\. The Web address you entered is not a functioning page/i.test(html)) return true;
  if (/Page Not Found/i.test(title)) return true;
  if (/^Amazon\.com$/i.test(title)) return true; // bare homepage redirect
  return false;
}

function titleMatchesKeywords(title, keywords) {
  if (!title) return false;
  const t = title.toLowerCase();
  // Match if ANY keyword shows up; keywords are lowercase already.
  for (const kw of keywords) if (t.includes(kw)) return true;
  return false;
}

export async function verifyAsin(asin, expectKeywords, opts = {}) {
  const { timeoutMs = 12_000 } = opts;
  const url = `https://www.amazon.com/dp/${asin}?tag=${TAG}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    }).finally(() => clearTimeout(t));
    if (res.status < 200 || res.status >= 400) {
      return { ok: false, status: res.status, title: "", detail: `http:${res.status}` };
    }
    const html = await res.text();
    const title = parseTitle(html);
    if (looksLikeNotFound(html, title)) {
      return { ok: false, status: res.status, title, detail: "amazon-not-found" };
    }
    if (!titleMatchesKeywords(title, expectKeywords)) {
      return { ok: false, status: res.status, title, detail: "title-mismatch" };
    }
    return { ok: true, status: res.status, title, detail: "" };
  } catch (e) {
    return { ok: false, status: "ERR", title: "", detail: String(e?.name || e) };
  }
}

export async function verifyAsinTriple(asin, expectKeywords, opts = {}) {
  const passes = [];
  for (let i = 0; i < 3; i++) {
    const r = await verifyAsin(asin, expectKeywords, opts);
    passes.push(r);
    if (r.ok) break; // one real ok is enough; we still record what we have
    await sleep(jitter(1500, 3000));
  }
  const verdict = passes.some((p) => p.ok) ? "ok" : "fail";
  return { verdict, passes };
}
