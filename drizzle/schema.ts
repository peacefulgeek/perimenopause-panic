import {
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  longtext,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Articles — the editorial corpus. Status is queued or published. The cron
 * publisher releases queued items per the phase rules in the master scope.
 */
export const articles = mysqlTable(
  "articles",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    title: varchar("title", { length: 320 }).notNull(),
    metaDescription: text("meta_description").notNull(),
    ogTitle: varchar("og_title", { length: 320 }).notNull(),
    ogDescription: text("og_description").notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    tags: json("tags").$type<string[]>().notNull(),
    imageAlt: text("image_alt").notNull(),
    readingTime: int("reading_time").notNull().default(7),
    author: varchar("author", { length: 80 }).notNull().default("The Oracle Lover"),
    status: mysqlEnum("status", ["queued", "published"]).notNull().default("queued"),
    publishedAt: timestamp("published_at"),
    lastModifiedAt: timestamp("last_modified_at").defaultNow().onUpdateNow().notNull(),
    wordCount: int("word_count").notNull().default(0),
    heroUrl: varchar("hero_url", { length: 500 }).notNull(),
    asinsUsed: json("asins_used").$type<string[]>().notNull(),
    internalLinksUsed: json("internal_links_used").$type<string[]>().notNull(),
    body: longtext("body").notNull(),
    tldr: text("tldr").notNull(),
    opener: mysqlEnum("opener", [
      "gut-punch",
      "question",
      "story",
      "counterintuitive",
    ]).notNull(),
    conclusion: mysqlEnum("conclusion", [
      "cta",
      "reflection",
      "question",
      "challenge",
      "benediction",
    ]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("status_idx").on(t.status),
    publishedAtIdx: index("published_at_idx").on(t.publishedAt),
  }),
);

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Cron run history. Used for verifying multi-day publish distribution and
 * for the admin diagnostics endpoint.
 */
export const cronRuns = mysqlTable("cron_runs", {
  id: int("id").autoincrement().primaryKey(),
  job: varchar("job", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["ok", "skipped", "error"]).notNull(),
  message: text("message"),
  payload: json("payload").$type<Record<string, unknown>>(),
  ranAt: timestamp("ran_at").defaultNow().notNull(),
});

export type CronRun = typeof cronRuns.$inferSelect;
export type InsertCronRun = typeof cronRuns.$inferInsert;
