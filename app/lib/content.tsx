import { getReadyDb } from './db';
import {
  DEFAULT_CONTENT,
  DEFAULT_JOBS,
  DEFAULT_MENUS,
  type JobItem,
  type MenuItem,
} from './defaults';

export type Content = Record<string, string>;

/**
 * Defaults with any saved overrides layered on top. A blank saved value falls
 * back to the default, so clearing a field in the admin restores the original
 * copy instead of leaving a hole in the page.
 */
export async function loadContent(): Promise<Content> {
  const db = await getReadyDb();
  if (!db) return { ...DEFAULT_CONTENT };

  try {
    const { results } = await db
      .prepare('SELECT key, value FROM content')
      .all<{ key: string; value: string }>();

    const merged = { ...DEFAULT_CONTENT };
    for (const row of results ?? []) {
      // Toggles are meaningful when set to "false"; text fields are not.
      if (row.value !== '' || !(row.key in DEFAULT_CONTENT)) merged[row.key] = row.value;
    }
    return merged;
  } catch {
    return { ...DEFAULT_CONTENT };
  }
}

export async function loadMenus({ includeDrafts = false } = {}): Promise<MenuItem[]> {
  const db = await getReadyDb();
  if (!db) return DEFAULT_MENUS;

  try {
    const { results } = await db
      .prepare('SELECT * FROM menus ORDER BY sort_order ASC, title ASC')
      .all<Record<string, unknown>>();

    const rows = results ?? [];
    // An untouched database means the owners have not set menus up yet, so the
    // original six categories still show.
    if (rows.length === 0) return includeDrafts ? [] : DEFAULT_MENUS;

    const menus = rows.map(rowToMenu);
    return includeDrafts ? menus : menus.filter((menu) => menu.status === 'published');
  } catch {
    return DEFAULT_MENUS;
  }
}

function rowToMenu(row: Record<string, unknown>): MenuItem {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    blurb: String(row.blurb ?? ''),
    fileKey: (row.file_key as string | null) || null,
    fileType: (row.file_type as string | null) || null,
    linkUrl: (row.link_url as string | null) || null,
    sortOrder: Number(row.sort_order ?? 0),
    status: row.status === 'draft' ? 'draft' : 'published',
  };
}

export async function loadJobs({ includeDrafts = false } = {}): Promise<JobItem[]> {
  const db = await getReadyDb();
  if (!db) return DEFAULT_JOBS;

  try {
    const { results } = await db
      .prepare('SELECT * FROM jobs ORDER BY sort_order ASC, title ASC')
      .all<Record<string, unknown>>();

    const rows = results ?? [];
    if (rows.length === 0) return includeDrafts ? [] : DEFAULT_JOBS;

    const jobs = rows.map(rowToJob);
    return includeDrafts ? jobs : jobs.filter((job) => job.status === 'published');
  } catch {
    return DEFAULT_JOBS;
  }
}

function rowToJob(row: Record<string, unknown>): JobItem {
  let duties: string[] = [];
  try {
    const parsed: unknown = JSON.parse(String(row.duties ?? '[]'));
    if (Array.isArray(parsed)) duties = parsed.map(String);
  } catch {
    duties = [];
  }

  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    schedule: String(row.schedule ?? ''),
    experience: String(row.experience ?? ''),
    duties,
    applyUrl: String(row.apply_url ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    status: row.status === 'draft' ? 'draft' : 'published',
  };
}

// --- shaping helpers used by the page templates -----------------------------

/** Splits a multi-line field into trimmed, non-empty lines. */
export function toLines(value: string | undefined): string[] {
  return (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Splits `"1979 | The story begins"` lines into label/detail pairs. */
export function toPairs(value: string | undefined): { lead: string; detail: string }[] {
  return toLines(value).map((line) => {
    const [lead, ...rest] = line.split('|');
    return { lead: lead.trim(), detail: rest.join('|').trim() };
  });
}

export function isOn(value: string | undefined): boolean {
  return value === 'true';
}

/** Renders a multi-line field as text separated by real line breaks. */
export function withBreaks(value: string | undefined): React.ReactNode[] {
  return toLines(value).flatMap((line, index) =>
    index === 0 ? [line] : [<br key={`br-${index}`} />, line],
  );
}

export function telHref(content: Content): string {
  return `tel:${content['site.phone_dial']}`;
}

/** Where a menu row points: its uploaded file, its own link, or the shared menus page. */
export function menuHref(menu: MenuItem, content: Content): string | null {
  if (menu.fileKey) return `/uploads/${menu.fileKey}`;
  if (menu.linkUrl) return menu.linkUrl;
  return content['site.menus_url'] || null;
}
