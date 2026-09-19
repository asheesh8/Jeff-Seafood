'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logIn, logOut, requireSignedIn } from '../lib/auth';
import { putFile, updateStore } from '../lib/store';
import { CONTENT_GROUPS, DEFAULT_JOBS, DEFAULT_MENUS, type JobItem, type MenuItem } from '../lib/defaults';

export type ActionState = { ok?: string; error?: string };

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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

/** Stores a file under a content-addressed key and returns the URL to link to. */
async function storeUpload(file: File, folder: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.`);
  }

  const extension = EXTENSIONS[file.type];
  if (!extension) throw new Error('Use a JPG, PNG, WEBP, GIF, AVIF, or PDF file.');

  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest).slice(0, 10))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return putFile(`${folder}/${hash}.${extension}`, bytes, file.type);
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

  const updates: Record<string, string> = {};

  try {
    for (const field of group.fields) {
      if (field.type === 'toggle') {
        updates[field.key] = formData.get(field.key) ? 'true' : 'false';
        continue;
      }

      if (field.type === 'image') {
        const file = uploadedFile(formData, `${field.key}__file`);
        if (file) {
          updates[field.key] = await storeUpload(file, 'photos');
          continue;
        }
      }

      updates[field.key] = String(formData.get(field.key) ?? '').trim();
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'That upload did not work.' };
  }

  const result = await updateStore((current) => ({
    ...current,
    content: { ...current.content, ...updates },
  }));
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: 'Saved. Refresh the site to see the change.' };
}

export async function resetGroupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const groupId = String(formData.get('group') ?? '');
  const group = CONTENT_GROUPS.find((candidate) => candidate.id === groupId);
  if (!group) return { error: 'Unknown section.' };

  const result = await updateStore((current) => {
    // Dropping the saved keys lets the built-in defaults show through again.
    const content = { ...current.content };
    for (const field of group.fields) delete content[field.key];
    return { ...current, content };
  });
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: 'This section is back to its original wording.' };
}

// --- shared helpers ---------------------------------------------------------

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'item'
  );
}

function uniqueId(taken: string[], base: string): string {
  if (!taken.includes(base)) return base;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    if (!taken.includes(`${base}-${suffix}`)) return `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}

function nextOrder(items: { sortOrder: number }[]): number {
  return items.reduce((highest, item) => Math.max(highest, item.sortOrder), 0) + 1;
}

// --- menus ------------------------------------------------------------------

export async function saveMenuAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { error: 'Give the menu a name.' };

  const existingId = String(formData.get('id') ?? '').trim();
  const blurb = String(formData.get('blurb') ?? '').trim();
  const linkUrl = String(formData.get('link_url') ?? '').trim() || null;
  const status: MenuItem['status'] = formData.get('status') === 'draft' ? 'draft' : 'published';

  let fileUrl: string | null = null;
  let fileType: string | null = null;

  try {
    const file = uploadedFile(formData, 'file');
    if (file) {
      fileUrl = await storeUpload(file, 'menus');
      fileType = file.type;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'That upload did not work.' };
  }

  const result = await updateStore((current) => {
    if (existingId) {
      const menus = current.menus.map((menu) =>
        menu.id === existingId
          ? {
              ...menu,
              title,
              blurb,
              linkUrl,
              status,
              // Keep the current file when the owner edits without re-uploading.
              fileUrl: fileUrl ?? menu.fileUrl,
              fileType: fileUrl ? fileType : menu.fileType,
            }
          : menu,
      );
      return { ...current, menus };
    }

    const menu: MenuItem = {
      id: uniqueId(current.menus.map((item) => item.id), slugify(title)),
      title,
      blurb,
      fileUrl,
      fileType,
      linkUrl,
      sortOrder: nextOrder(current.menus),
      status,
    };
    return { ...current, menus: [...current.menus, menu] };
  });
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: existingId ? `“${title}” updated.` : `“${title}” added.` };
}

export async function deleteMenuAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const id = String(formData.get('id') ?? '');
  const result = await updateStore((current) => ({
    ...current,
    menus: current.menus.filter((menu) => menu.id !== id),
  }));
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: 'Menu removed.' };
}

export async function moveMenuAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const id = String(formData.get('id') ?? '');
  const step = formData.get('direction') === 'up' ? -1 : 1;
  let moved = false;

  const result = await updateStore((current) => {
    const menus = [...current.menus].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = menus.findIndex((menu) => menu.id === id);
    const target = index + step;
    if (index === -1 || target < 0 || target >= menus.length) return current;

    [menus[index], menus[target]] = [menus[target], menus[index]];
    moved = true;
    return { ...current, menus: menus.map((menu, position) => ({ ...menu, sortOrder: position + 1 })) };
  });
  if (!result.ok) return { error: result.error };
  if (!moved) return { ok: 'Already at the end of the list.' };

  refresh();
  return { ok: 'Order updated.' };
}

/** Copies the six built-in categories into the store so they can be edited. */
export async function seedMenusAction(): Promise<ActionState> {
  await requireSignedIn();

  let already = false;
  const result = await updateStore((current) => {
    if (current.menus.length > 0) {
      already = true;
      return current;
    }
    return { ...current, menus: DEFAULT_MENUS.map((menu) => ({ ...menu })) };
  });
  if (!result.ok) return { error: result.error };
  if (already) return { error: 'You already have menus here.' };

  refresh();
  return { ok: 'The six starting categories are now yours to edit.' };
}

// --- jobs -------------------------------------------------------------------

export async function saveJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { error: 'Give the position a title.' };

  const existingId = String(formData.get('id') ?? '').trim();
  const fields = {
    title,
    schedule: String(formData.get('schedule') ?? '').trim(),
    experience: String(formData.get('experience') ?? '').trim(),
    applyUrl: String(formData.get('apply_url') ?? '').trim(),
    status: (formData.get('status') === 'draft' ? 'draft' : 'published') as JobItem['status'],
    duties: String(formData.get('duties') ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  };

  const result = await updateStore((current) => {
    if (existingId) {
      const jobs = current.jobs.map((job) => (job.id === existingId ? { ...job, ...fields } : job));
      return { ...current, jobs };
    }

    const job: JobItem = {
      id: uniqueId(current.jobs.map((item) => item.id), slugify(title)),
      sortOrder: nextOrder(current.jobs),
      ...fields,
    };
    return { ...current, jobs: [...current.jobs, job] };
  });
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: existingId ? `“${title}” updated.` : `“${title}” added.` };
}

export async function deleteJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSignedIn();

  const id = String(formData.get('id') ?? '');
  const result = await updateStore((current) => ({
    ...current,
    jobs: current.jobs.filter((job) => job.id !== id),
  }));
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: 'Position removed.' };
}

export async function seedJobsAction(): Promise<ActionState> {
  await requireSignedIn();

  let already = false;
  const result = await updateStore((current) => {
    if (current.jobs.length > 0) {
      already = true;
      return current;
    }
    return { ...current, jobs: DEFAULT_JOBS.map((job) => ({ ...job, duties: [...job.duties] })) };
  });
  if (!result.ok) return { error: result.error };
  if (already) return { error: 'You already have positions here.' };

  refresh();
  return { ok: 'The two current postings are now yours to edit.' };
}
