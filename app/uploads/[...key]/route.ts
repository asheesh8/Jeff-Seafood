import { getFile } from '../../lib/store';

export const dynamic = 'force-dynamic';

/**
 * Serves uploads for hosts whose storage is not publicly addressable — today
 * that is Cloudflare R2 and the local development disk. On Vercel, Blob serves
 * its own absolute URLs and nothing routes through here.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join('/');

  // Keys are generated server-side on upload, so the only thing to guard here
  // is path traversal from a hand-typed URL.
  if (!objectKey || objectKey.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const file = await getFile(objectKey);
  if (!file) return new Response('Not found', { status: 404 });

  const headers = new Headers({
    'content-type': file.contentType,
    // Keys are content-hashed, so a long cache is safe and replacing a file
    // produces a new URL rather than a stale one.
    'cache-control': 'public, max-age=31536000, immutable',
  });
  if (file.etag) headers.set('etag', file.etag);

  return new Response(file.body as BodyInit, { headers });
}
