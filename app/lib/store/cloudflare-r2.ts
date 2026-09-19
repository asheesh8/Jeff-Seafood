import { DATA_KEY, type Driver, type StoreData } from './types';

// Only the handful of R2 methods this app uses. Declared locally so the
// project does not need @cloudflare/workers-types in its global type set,
// which would otherwise override the DOM globals a Next.js build expects.
type R2Object = {
  body: ReadableStream<Uint8Array>;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
  json<T>(): Promise<T>;
  writeHttpMetadata(headers: Headers): void;
};

export type R2Bucket = {
  get(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
};

/**
 * Cloudflare R2. Objects are private, so uploads return a `/uploads/…` path
 * that `app/uploads/[...key]/route.ts` serves back.
 */
export function createR2Driver(bucket: R2Bucket): Driver {
  return {
    name: 'cloudflare-r2',
    writable: true,

    async read() {
      const object = await bucket.get(DATA_KEY);
      if (!object) return null;
      try {
        return await object.json<StoreData>();
      } catch {
        return null;
      }
    },

    async write(data) {
      await bucket.put(DATA_KEY, JSON.stringify(data, null, 2), {
        httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
      });
    },

    async putFile(key, bytes, contentType) {
      await bucket.put(key, bytes, { httpMetadata: { contentType } });
      return `/uploads/${key}`;
    },

    async getFile(key) {
      const object = await bucket.get(key);
      if (!object) return null;
      return {
        body: object.body,
        contentType: object.httpMetadata?.contentType ?? 'application/octet-stream',
        etag: object.httpEtag,
      };
    },
  };
}
