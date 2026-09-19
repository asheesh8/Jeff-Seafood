import { DATA_KEY, type Driver, type StoreData } from './types';

/**
 * Development only. Keeps the document and uploads under `.data/` so the admin
 * panel is fully usable locally without a Blob token or a Cloudflare binding.
 * Never selected in production — see `pickDriver` in ./index.
 */
export function createLocalDiskDriver(root: string): Driver {
  const resolve = async (key: string) => {
    const { join } = await import('node:path');
    return join(root, key);
  };

  return {
    name: 'local-disk',
    writable: true,

    async read() {
      const { readFile } = await import('node:fs/promises');
      try {
        return JSON.parse(await readFile(await resolve(DATA_KEY), 'utf8')) as StoreData;
      } catch {
        return null;
      }
    },

    async write(data) {
      const { mkdir, writeFile } = await import('node:fs/promises');
      const { dirname } = await import('node:path');
      const path = await resolve(DATA_KEY);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(data, null, 2), 'utf8');
    },

    async putFile(key, bytes, contentType) {
      const { mkdir, writeFile } = await import('node:fs/promises');
      const { dirname } = await import('node:path');
      const path = await resolve(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, Buffer.from(bytes));
      await writeFile(`${path}.type`, contentType, 'utf8');
      return `/uploads/${key}`;
    },

    async getFile(key) {
      const { readFile } = await import('node:fs/promises');
      const path = await resolve(key);
      try {
        const bytes = await readFile(path);
        let contentType = 'application/octet-stream';
        try {
          contentType = await readFile(`${path}.type`, 'utf8');
        } catch {
          // Type sidecar is best-effort.
        }
        return {
          body: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
          contentType,
        };
      } catch {
        return null;
      }
    },
  };
}
