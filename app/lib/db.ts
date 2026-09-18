// Cloudflare bindings are declared in `.openai/hosting.json` and wired up by
// `vite.config.ts`. They are absent until the Sites project provisions them, so
// every accessor here returns null rather than throwing. Callers fall back to
// the built-in defaults in `defaults.ts`, which keeps the public site rendering
// exactly as it did before the admin panel existed.

type Env = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

let cachedEnv: Env | null | undefined;

async function loadEnv(): Promise<Env | null> {
  if (cachedEnv !== undefined) return cachedEnv;
  try {
    const mod = await import('cloudflare:workers');
    cachedEnv = (mod.env ?? null) as Env | null;
  } catch {
    cachedEnv = null;
  }
  return cachedEnv;
}

export async function getSecret(name: 'ADMIN_PASSWORD' | 'ADMIN_SESSION_SECRET') {
  const env = await loadEnv();
  return env?.[name] ?? process.env[name] ?? null;
}

export async function getDb(): Promise<D1Database | null> {
  const env = await loadEnv();
  return env?.DB ?? null;
}

export async function getBucket(): Promise<R2Bucket | null> {
  const env = await loadEnv();
  return env?.MEDIA ?? null;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS content (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS menus (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     blurb TEXT NOT NULL DEFAULT '',
     file_key TEXT,
     file_type TEXT,
     link_url TEXT,
     sort_order INTEGER NOT NULL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'published',
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS jobs (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     schedule TEXT NOT NULL DEFAULT '',
     experience TEXT NOT NULL DEFAULT '',
     duties TEXT NOT NULL DEFAULT '[]',
     apply_url TEXT NOT NULL DEFAULT '',
     sort_order INTEGER NOT NULL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'published',
     updated_at TEXT NOT NULL
   )`,
];

// Isolate-scoped: the statements are idempotent, so worst case a cold isolate
// replays three no-op DDL statements on its first admin/page request.
let schemaReady: Promise<void> | null = null;

export async function ensureSchema(db: D1Database) {
  schemaReady ??= (async () => {
    await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

/** A DB handle with its tables guaranteed to exist, or null when unprovisioned. */
export async function getReadyDb(): Promise<D1Database | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    await ensureSchema(db);
    return db;
  } catch {
    return null;
  }
}

export type StorageStatus = {
  db: boolean;
  bucket: boolean;
  password: boolean;
};

export async function getStorageStatus(): Promise<StorageStatus> {
  const [db, bucket, password] = await Promise.all([
    getReadyDb(),
    getBucket(),
    getSecret('ADMIN_PASSWORD'),
  ]);
  return { db: Boolean(db), bucket: Boolean(bucket), password: Boolean(password) };
}
