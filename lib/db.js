import Database from "better-sqlite3"
import path from "path"

let db

export function getDb() {
  if (!db) {
    db = new Database(path.join(process.cwd(), "seo.db"))
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")
    db.exec(`
      CREATE TABLE IF NOT EXISTS tracked_keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        domain TEXT NOT NULL,
        engine TEXT NOT NULL DEFAULT 'duckduckgo',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(keyword, domain, engine)
      );
      CREATE TABLE IF NOT EXISTS rank_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracked_id INTEGER NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
        position INTEGER,
        total_results INTEGER,
        checked_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_rank_checks_tracked ON rank_checks(tracked_id, id DESC);
      CREATE TABLE IF NOT EXISTS gsc_tokens (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        access_token TEXT,
        refresh_token TEXT,
        expires_at INTEGER
      );
    `)
  }
  return db
}
