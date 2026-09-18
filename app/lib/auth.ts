import { cookies } from 'next/headers';
import { getSecret } from './db';

const COOKIE = 'jeffs_admin';
const SESSION_HOURS = 12;

const encoder = new TextEncoder();

async function signingKey(): Promise<CryptoKey | null> {
  // A dedicated session secret is preferred, but falling back to the admin
  // password means a working install only needs one secret configured.
  const secret = (await getSecret('ADMIN_SESSION_SECRET')) ?? (await getSecret('ADMIN_PASSWORD'));
  if (!secret) return null;

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sign(payload: string): Promise<string | null> {
  const key = await signingKey();
  if (!key) return null;
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

/** Compares two strings without leaking how many characters matched. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type LoginResult = { ok: true } | { ok: false; reason: 'unconfigured' | 'wrong' };

export async function logIn(password: string): Promise<LoginResult> {
  const expected = await getSecret('ADMIN_PASSWORD');
  if (!expected) return { ok: false, reason: 'unconfigured' };

  if (!timingSafeEqual(password, expected)) {
    // A shared password is only as good as its length; this delay takes the
    // edge off automated guessing without needing a rate-limit store.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { ok: false, reason: 'wrong' };
  }

  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const signature = await sign(String(expires));
  if (!signature) return { ok: false, reason: 'unconfigured' };

  const store = await cookies();
  store.set(COOKIE, `${expires}.${signature}`, {
    httpOnly: true,
    // Workers always serves over HTTPS; plain-HTTP localhost would drop a Secure cookie.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  });

  return { ok: true };
}

export async function logOut() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return false;

  const [expires, signature] = raw.split('.');
  if (!expires || !signature) return false;
  if (!Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return false;

  const expected = await sign(expires);
  return Boolean(expected) && timingSafeEqual(signature, expected!);
}

/** Throws unless the caller holds a valid session. Guards every server action. */
export async function requireSignedIn() {
  if (!(await isSignedIn())) throw new Error('Not signed in.');
}
