import { getBucket } from '../../lib/db';

export const dynamic = 'force-dynamic';

/**
 * Serves menu files and photos uploaded through /admin out of the R2 bucket.
 * Object keys are generated server-side on upload, so the only thing to guard
 * here is path traversal from a hand-typed URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join('/');

  if (!objectKey || objectKey.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const bucket = await getBucket();
  if (!bucket) return new Response('Storage is not configured.', { status: 503 });

  const object = await bucket.get(objectKey);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // Keys are content-hashed, so a long cache is safe and replacing a file
  // produces a new URL rather than a stale one.
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body as ReadableStream, { headers });
}
