import type { JobItem, MenuItem } from '../defaults';

/**
 * Everything the restaurant can edit, held in a single small JSON document.
 * At this size (a few dozen strings and a handful of rows) a document is a
 * better fit than a database: one read per request, no schema to migrate, and
 * the same shape works on every hosting platform.
 */
export type StoreData = {
  content: Record<string, string>;
  menus: MenuItem[];
  jobs: JobItem[];
  updatedAt: string;
};

export const EMPTY_STORE: StoreData = {
  content: {},
  menus: [],
  jobs: [],
  updatedAt: '',
};

export type StoredFile = {
  body: ReadableStream<Uint8Array> | ArrayBuffer;
  contentType: string;
  etag?: string;
};

/**
 * A place to keep the document and the uploaded files. Implemented once per
 * host — Vercel Blob, Cloudflare R2, and the local disk for development.
 */
export type Driver = {
  readonly name: 'vercel-blob' | 'cloudflare-r2' | 'local-disk';

  /** Whether uploads can be written. Reads always fall back to defaults. */
  readonly writable: boolean;

  read(): Promise<StoreData | null>;
  write(data: StoreData): Promise<void>;

  /**
   * Stores a file and returns the URL the site should link to — an absolute
   * URL where the host serves blobs itself, or a `/uploads/…` path where the
   * file has to be served back through this app.
   */
  putFile(key: string, bytes: ArrayBuffer, contentType: string): Promise<string>;

  /** Only needed by drivers whose files are not publicly addressable. */
  getFile?(key: string): Promise<StoredFile | null>;
};

export const DATA_KEY = 'site/data.json';
