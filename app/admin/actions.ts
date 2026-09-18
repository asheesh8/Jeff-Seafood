'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logIn, logOut, requireSignedIn } from '../lib/auth';
import { getBucket, getReadyDb } from '../lib/db';
import { CONTENT_GROUPS } from '../lib/defaults';

export type ActionState = { ok?: string; error?: string };

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
]);

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
};

/**
 * Re-renders the admin route so a saved change shows in the lists immediately,
 * and the public pages so the next visitor gets the new content.
 */
function refresh() {
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/jobs');
}

// --- sign in / out ----------------------------------------------------------

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get('password') ?? '');
  if (!password) return { error: 'Enter the password.' };

  const result = await logIn(password);
  if (result.ok) redirect('/admin');

  return {
    error:
      result.reason === 'unconfigured'
        ? 'No admin password is set on the server yet. See the setup notes in the handover document.'
        : 'That password is not right.',
  };
}

export async function signOutAction() {
  await logOut();
  redirect('/admin');
}

// --- uploads ----------------------------------------------------------------

/** Stores a file in R2 under a content-addressed key and returns its public path. */
async function storeUpload(file: File, folder: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.`);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Use a JPG, PNG, WEBP, GIF, AVIF, or PDF file.');
  }

  const bucket = await getBucket();
  if (!bucket) throw new Error('File storage is not connected yet, so uploads cannot be saved.');

  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest).slice(0, 10))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  const key = `${folder}/${hash}.${EXTENSIONS[file.type]}`;
  await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } });

  return `/uploads/${key}`;
}

function uploadedFile(formData: FormData, field: string): File | null {
  const value = formData.get(field);
  return value instanceof File && value.size > 0 ? value : null;
}

// --- page content -----------------------------------------------------------

export async function saveContentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSignedIn();

  const groupId = String(formData.get('group') ?? '');
  const group = CONTENT_GROUPS.find((candidate) => candidate.id === groupId);
  if (!group) return { error: 'Unknown section.' };

  const db = await getReadyDb();
  if (!db) return { error: 'The content database is not connected yet, so nothing was saved.' };

  const updates: { key: string; value: string }[] = [];

  try {
    for (const field of group.fields) {
      if (field.type === 'toggle') {
        updates.push({ key: field.key, value: formData.get(field.key) ? 'true' : 'false' });
        continue;
      }

      if (field.type === 'image') {
        const file = uploadedFile(formData, `${field.key}__file`);
        if (file) {
          updates.push({ key: field.key, value: await storeUpload(file, 'photos') });
          continue;
        }
      }

      updates.push({ key: field.key, value: String(formData.get(field.key) ?? '').trim() });
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'That upload did not work.' };
  }

  const now = new Date().toISOString();
  await db.batch(
    updates.map((update) =>
      db
        .prepare(
          `INSERT INTO content (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        )
        .bind(update.key, update.value, now),
    ),
  );

  refresh();
  return { ok: `Saved. Refresh the site to see the change.` };
}

export async function resetGroupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const groupId = String(formData.get('group') ?? '');
  const group = CONTENT_GROUPS.find((candidate) => candidate.id === groupId);
  if (!group) return { error: 'Unknown section.' };

  const db = await getReadyDb();
  if (!db) return { error: 'The content database is not connected yet.' };

  // Dropping the saved rows lets the built-in defaults show through again.
  await db.batch(
    group.fields.map((field) => db.prepare('DELETE FROM content WHERE key = ?').bind(field.key)),
  );

  refresh();
  return { ok: 'This section is back to its original wording.' };
}

// --- menus ------------------------------------------------------------------

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'item'
  );
}

async function uniqueId(db: D1Database, table: 'menus' | 'jobs', base: string): Promise<string> {
  let id = base;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const existing = await db.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(id).first();
    if (!existing) return id;
    id = `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}

export async function saveMenuAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const db = await getReadyDb();
  if (!db) return { error: 'The content database is not connected yet, so nothing was saved.' };

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { error: 'Give the menu a name.' };

  const existingId = String(formData.get('id') ?? '').trim();
  const blurb = String(formData.get('blurb') ?? '').trim();
  const linkUrl = String(formData.get('link_url') ?? '').trim();
  const status = formData.get('status') === 'draft' ? 'draft' : 'published';
  const now = new Date().toISOString();

  let fileKey: string | null = null;
  let fileType: string | null = null;

  try {
    const file = uploadedFile(formData, 'file');
    if (file) {
      const path = await storeUpload(file, 'menus');
      fileKey = path.replace('/uploads/', '');
      fileType = file.type;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'That upload did not work.' };
  }

  if (existingId) {
    // Keep the current file when the owner edits a menu without re-uploading.
    if (fileKey) {
      await db
        .prepare(
          `UPDATE menus SET title = ?, blurb = ?, link_url = ?, status = ?,
             file_key = ?, file_type = ?, updated_at = ? WHERE id = ?`,
        )
        .bind(title, blurb, linkUrl || null, status, fileKey, fileType, now, existingId)
        .run();
    } else {
      await db
        .prepare(
          `UPDATE menus SET title = ?, blurb = ?, link_url = ?, status = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(title, blurb, linkUrl || null, status, now, existingId)
        .run();
    }

    refresh();
    return { ok: `“${title}” updated.` };
  }

  const nextOrder = await db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM menus')
    .first<{ next: number }>();

  const id = await uniqueId(db, 'menus', slugify(title));

  await db
    .prepare(
      `INSERT INTO menus (id, title, blurb, file_key, file_type, link_url, sort_order, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, title, blurb, fileKey, fileType, linkUrl || null, nextOrder?.next ?? 1, status, now)
    .run();

  refresh();
  return { ok: `“${title}” added.` };
}

export async function deleteMenuAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const db = await getReadyDb();
  if (!db) return { error: 'The content database is not connected yet.' };

  const id = String(formData.get('id') ?? '');
  await db.prepare('DELETE FROM menus WHERE id = ?').bind(id).run();

  refresh();
  return { ok: 'Menu removed.' };
}

export async function moveMenuAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const db = await getReadyDb();
  if (!db) return { error: 'The content database is not connected yet.' };

  const id = String(formData.get('id') ?? '');
  const direction = formData.get('direction') === 'up' ? 'up' : 'down';

  const current = await db
    .prepare('SELECT id, sort_order FROM menus WHERE id = ?')
    .bind(id)
    .first<{ id: string; sort_order: number }>();
  if (!current) return { error: 'That menu no longer exists.' };

  const neighbour = await db
    .prepare(
      direction === 'up'
        ? 'SELECT id, sort_order FROM menus WHERE sort_order < ? ORDER BY sort_order DESC LIMIT 1'
        : 'SELECT id, sort_order FROM menus WHERE sort_order > ? ORDER BY sort_order ASC LIMIT 1',
    )
    .bind(current.sort_order)
    .first<{ id: string; sort_order: number }>();

  if (!neighbour) return { ok: 'Already at the end of the list.' };

  await db.batch([
    db.prepare('UPDATE menus SET sort_order = ? WHERE id = ?').bind(neighbour.sort_order, current.id),
    db.prepare('UPDATE menus SET sort_order = ? WHERE id = ?').bind(current.sort_order, neighbour.id),
  ]);

  refresh();
  return { ok: 'Order updated.' };
}

/** Copies the six built-in categories into the database so they can be edited. */
export async function seedMenusAction(): Promise<ActionState> {
  await requireSignedIn();

  const db = await getReadyDb();
  if (!db) return { error: 'The content database is not connected yet.' };

  const existing = await db.prepare('SELECT COUNT(*) AS count FROM menus').first<{ count: number }>();
  if ((existing?.count ?? 0) > 0) return { error: 'You already have menus here.' };

  const { DEFAULT_MENUS } = await import('../lib/defaults');
  const now = new Date().toISOString();

  await db.batch(
    DEFAULT_MENUS.map((menu) =>
      db
        .prepare(
          `INSERT INTO menus (id, title, blurb, file_key, file_type, link_url, sort_order, status, updated_at)
           VALUES (?, ?, ?, NULL, NULL, NULL, ?, 'published', ?)`,
        )
        .bind(menu.id, menu.title, menu.blurb, menu.sortOrder, now),
    ),
  );

  refresh();
  return { ok: 'The six starting categories are now yours to edit.' };
}

// --- jobs -------------------------------------------------------------------

export async function saveJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const db = await getReadyDb();
  if (!db) return { error: 'The content database is not connected yet, so nothing was saved.' };

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { error: 'Give the position a title.' };

  const existingId = String(formData.get('id') ?? '').trim();
  const schedule = String(formData.get('schedule') ?? '').trim();
  const experience = String(formData.get('experience') ?? '').trim();
  const applyUrl = String(formData.get('apply_url') ?? '').trim();
  const status = formData.get('status') === 'draft' ? 'draft' : 'published';
  const duties = JSON.stringify(
    String(formData.get('duties') ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );
  const now = new Date().toISOString();

  if (existingId) {
    await db
      .prepare(
        `UPDATE jobs SET title = ?, schedule = ?, experience = ?, duties = ?, apply_url = ?,
           status = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(title, schedule, experience, duties, applyUrl, status, now, existingId)
      .run();

    refresh();
    return { ok: `“${title}” updated.` };
  }

  const nextOrder = await db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM jobs')
    .first<{ next: number }>();

  const id = await uniqueId(db, 'jobs', slugify(title));

  await db
    .prepare(
      `INSERT INTO jobs (id, title, schedule, experience, duties, apply_url, sort_order, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, title, schedule, experience, duties, applyUrl, nextOrder?.next ?? 1, status, now)
    .run();

  refresh();
  return { ok: `“${title}” added.` };
}

export async function deleteJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const db = await getReadyDb();
  if (!db) return { error: 'The content database is not connected yet.' };

  const id = String(formData.get('id') ?? '');
  await db.prepare('DELETE FROM jobs WHERE id = ?').bind(id).run();

  refresh();
  return { ok: 'Position removed.' };
}

export async function seedJobsAction(): Promise<ActionState> {
  await requireSignedIn();

  const db = await getReadyDb();
  if (!db) return { error: 'The content database is not connected yet.' };

  const existing = await db.prepare('SELECT COUNT(*) AS count FROM jobs').first<{ count: number }>();
  if ((existing?.count ?? 0) > 0) return { error: 'You already have positions here.' };

  const { DEFAULT_JOBS } = await import('../lib/defaults');
  const now = new Date().toISOString();

  await db.batch(
    DEFAULT_JOBS.map((job) =>
      db
        .prepare(
          `INSERT INTO jobs (id, title, schedule, experience, duties, apply_url, sort_order, status, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
        )
        .bind(job.id, job.title, job.schedule, job.experience, JSON.stringify(job.duties), job.applyUrl, job.sortOrder, now),
    ),
  );

  refresh();
  return { ok: 'The two current postings are now yours to edit.' };
}
