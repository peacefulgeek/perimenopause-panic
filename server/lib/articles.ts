import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { articles, type Article, type InsertArticle, cronRuns, type InsertCronRun } from "../../drizzle/schema";

export async function listPublishedArticles(limit = 60): Promise<Article[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function listAllPublishedSlugs(): Promise<
  Pick<Article, "slug" | "title" | "category" | "tags" | "publishedAt" | "lastModifiedAt" | "metaDescription" | "heroUrl">[]
> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      slug: articles.slug,
      title: articles.title,
      category: articles.category,
      tags: articles.tags,
      publishedAt: articles.publishedAt,
      lastModifiedAt: articles.lastModifiedAt,
      metaDescription: articles.metaDescription,
      heroUrl: articles.heroUrl,
    })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1);
  return rows[0] ?? null;
}

export async function countByStatus(): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return { queued: 0, published: 0 };
  const rows = await db
    .select({ status: articles.status, c: sql<number>`count(*)` })
    .from(articles)
    .groupBy(articles.status);
  const out: Record<string, number> = { queued: 0, published: 0 };
  for (const r of rows) out[r.status] = Number(r.c);
  return out;
}

export async function insertArticle(row: InsertArticle): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(articles).values(row);
}

export async function pickNextQueuedSlug(): Promise<Article | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "queued"))
    .orderBy(articles.id)
    .limit(1);
  return rows[0] ?? null;
}

export async function publishArticle(id: number, when: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(articles)
    .set({ status: "published", publishedAt: when, lastModifiedAt: when })
    .where(eq(articles.id, id));
}

export async function recordCronRun(row: InsertCronRun): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(cronRuns).values(row);
}

export async function recentCronRuns(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cronRuns).orderBy(desc(cronRuns.ranAt)).limit(limit);
}

export async function publishedDailyCounts(): Promise<{ day: string; c: number }[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT DATE(published_at) AS day, COUNT(*) AS c
    FROM articles
    WHERE status='published' AND published_at IS NOT NULL
    GROUP BY DATE(published_at)
    ORDER BY day DESC
    LIMIT 30
  `);
  // mysql2 returns [rows, fields]
  const list = (Array.isArray(rows) ? rows[0] : (rows as any)) as { day: string; c: number }[];
  return list || [];
}
