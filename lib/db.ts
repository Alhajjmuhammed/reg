import Database from 'better-sqlite3'
import path from 'path'

// Absolute path — no env var, no ambiguity, works in all contexts
const DB_PATH = path.join(process.cwd(), 'prisma', 'masterclass.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db || !_db.open) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('busy_timeout = 5000')
  }
  return _db
}

export function dbGetAll(): { key: string; value: unknown }[] {
  const rows = getDb()
    .prepare('SELECT key, value FROM kv_store')
    .all() as { key: string; value: string }[]
  return rows.map(r => ({ key: r.key, value: JSON.parse(r.value) }))
}

export function dbGetOne(key: string): { key: string; value: unknown } | null {
  const row = getDb()
    .prepare('SELECT key, value FROM kv_store WHERE key = ?')
    .get(key) as { key: string; value: string } | undefined
  if (!row) return null
  return { key: row.key, value: JSON.parse(row.value) }
}

export function dbGet<T>(key: string, fallback: T): T {
  const row = getDb()
    .prepare('SELECT value FROM kv_store WHERE key = ?')
    .get(key) as { value: string } | undefined
  if (!row) return fallback
  return JSON.parse(row.value) as T
}

export function dbSet(key: string, value: unknown): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO kv_store (key, value, updatedAt) VALUES (?, ?, datetime('now'))"
    )
    .run(key, JSON.stringify(value))
}
