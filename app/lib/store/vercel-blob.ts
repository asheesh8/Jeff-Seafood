import { DATA_KEY, type Driver, type StoreData } from './types';

/**
 * Vercel Blob. Files are publicly addressable, so uploads return an absolute
 * blob URL and never pass back through this app.
 *
 * `addRandomSuffix: false` keeps the data document at a stable pathname so it
 * can be overwritten in place, and `cacheControlMaxAge: 0` stops the CDN
 * serving a stale copy straight after a save.
 */
export function createVercelBlobDriver(token: string): Driver {
  return {
    name: 'vercel-blob',
    writable: true,

    async read() {
      const { head } = await import('@vercel/blob');
      try {
        const meta = await head(DATA_KEY, { token });
        const response = await fetch(meta.url, { cache: 'no-store' });
        if (!response.ok) return null;
        return (await response.json()) as StoreData;
      } catch {
        // `head` throws BlobNotFoundError before anything has been saved.
        return null;
      }
    },

    async write(data) {
      const { put } = await import('@vercel/blob');
      await put(DATA_KEY, JSON.stringify(data, null, 2), {
        token,
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 0,
      });
    },

    async putFile(key, bytes, contentType) {
      const { put } = await import('@vercel/blob');
      const result = await put(key, bytes, {
        token,
        access: 'public',
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return result.url;
    },
  };
}
