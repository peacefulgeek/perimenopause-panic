import { listPublishedArticles } from "../lib/articles";
async function main() {
  const all = await listPublishedArticles(2);
  const a = all[0];
  const body = a.body || "";
  const allLinks = Array.from(body.matchAll(/href="(https?:\/\/[^"]+)"/g)).map(m => m[1]);
  console.log("ALL links:", allLinks.length);
  const amazon = allLinks.filter(u => u.includes("amazon.com/s?k=") || u.includes("amazon.com/dp/"));
  console.log("AMAZON matches (filter):", amazon.length);
  const amazonAll = allLinks.filter(u => u.includes("amazon."));
  console.log("All amazon. URLs:", amazonAll.length);
  amazonAll.slice(0,3).forEach(u => console.log("  ", u));
}
main().then(()=>process.exit(0));
