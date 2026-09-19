import { cache } from 'react';
import { createLocalDiskDriver } from './local-disk';
import { createR2Driver, type R2Bucket } from './cloudflare-r2';
import { createVercelBlobDriver } from './vercel-blob';
import { EMPTY_STORE, type Driver, type StoreData } from './types';

export type { StoreData } from './types';

type CloudflareEnv = {
  MEDIA?: R2Bucket;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

let cloudflareEnv: CloudflareEnv | null | undefined;

/** Present only when running on Cloudflare Workers; null everywhere else. */
async function loadCloudflareEnv(): Promise<CloudflareEnv | null> {
  if (cloudflareEnv !== undefined) return cloudflareEnv;
  try {
    const mod = await import(/* @vite-ignore */ 'cloudflare:workers');
    cloudflareEnv = ((mod as { env?: CloudflareEnv }).env ?? null) as CloudflareEnv | null;
  } catch {
    cloudflareEnv = null;
  }
  return cloudflareEnv;
}

export async function getSecret(
  name: 'ADMIN_PASSWORD' | 'ADMIN_SESSION_SECRET',
): Promise<string | null> {
  const env = await loadCloudflareEnv();
  return env?.[name] ?? process.env[name] ?? null;
}

let driver: Driver | null | undefined;

/**
 * Cloudflare first, since its binding only exists when we are actually running
 * there. Then Vercel Blob. The disk driver is a development convenience and is
 * never chosen in production, so a misconfigured deploy falls back to the
 * built-in defaults rather than silently writing to a container that vanishes.
 */
async function pickDriver(): Promise<Driver | null> {
  if (driver !== undefined) return driver;

  const env = await loadCloudflareEnv();
  if (env?.MEDIA) {
    driver = createR2Driver(env.MEDIA);
    return driver;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    driver = createVercelBlobDriver(token);
    return driver;
  }

  if (process.env.NODE_ENV !== 'production') {
    const { join } = await import('node:path');
    driver = createLocalDiskDriver(join(process.cwd(), '.data'));
    return driver;
  }

  driver = null;
  return driver;
}

/**
 * One read per request. Every page pulls content, menus and jobs from the same
 * document, so without this each would fetch it again.
 */
export const readStore = cache(async (): Promise<StoreData> => {
  const active = await pickDriver();
  if (!active) return EMPTY_STORE;

  try {
    return (await active.read()) ?? EMPTY_STORE;
  } catch {
    return EMPTY_STORE;
  }
});

/** Applies a change to the document and saves it. */
export async function updateStore(
  change: (current: StoreData) => StoreData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const active = await pickDriver();
  if (!active) {
    return { ok: false, error: 'Storage is not connected yet, so nothing was saved.' };
  }

  try {
    const current = (await active.read()) ?? EMPTY_STORE;
    const next = change(current);
    await active.write({ ...next, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'That change could not be saved.',
    };
  }
}

export async function putFile(
  key: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const active = await pickDriver();
  if (!active) throw new Error('File storage is not connected yet, so uploads cannot be saved.');
  return active.putFile(key, bytes, contentType);
}

export async function getFile(key: string) {
  const active = await pickDriver();
  return active?.getFile ? active.getFile(key) : null;
}

export type StorageStatus = {
  ready: boolean;
  driver: Driver['name'] | null;
  password: boolean;
};

export async function getStorageStatus(): Promise<StorageStatus> {
  const [active, password] = await Promise.all([pickDriver(), getSecret('ADMIN_PASSWORD')]);
  return {
    ready: Boolean(active),
    driver: active?.name ?? null,
    password: Boolean(password),
  };
}
