/**
 * One-shot CLI harness for bunnyPublishNext(). Useful for:
 *  - smoke-testing the pure-Bunny publisher locally
 *  - the Railway cron entrypoint (call this script from a scheduled task)
 *  - the GitHub Actions cron (same)
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { bunnyPublishNext } from "../lib/bunnyPublisher";

const ENV_PATHS = [
  "/home/ubuntu/.bunny-perimenopause",
  path.resolve(process.cwd(), ".env"),
];
for (const f of ENV_PATHS) {
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}
// Force Bunny-only path
delete process.env.DATABASE_URL;

(async () => {
  const r = await bunnyPublishNext();
  console.log(JSON.stringify(r, null, 2));
  if (!r.ok && r.reason !== "queue-empty") process.exit(1);
})();
