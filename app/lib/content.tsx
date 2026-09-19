import { readStore } from './store';
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
  const { content } = await readStore();

  const merged = { ...DEFAULT_CONTENT };
  for (const [key, value] of Object.entries(content)) {
    // Toggles are meaningful when saved as "false"; empty text is not, and
    // falls back to the default so clearing a field restores the original copy.
    if (value !== '' || !(key in DEFAULT_CONTENT)) merged[key] = value;
  }
  return merged;
}

export async function loadMenus({ includeDrafts = false } = {}): Promise<MenuItem[]> {
  const { menus } = await readStore();

  // An untouched store means the owners have not set menus up yet, so the
  // original six categories still show on the site.
  if (menus.length === 0) return includeDrafts ? [] : DEFAULT_MENUS;

  const sorted = [...menus].sort((a, b) => a.sortOrder - b.sortOrder);
  return includeDrafts ? sorted : sorted.filter((menu) => menu.status === 'published');
}

export async function loadJobs({ includeDrafts = false } = {}): Promise<JobItem[]> {
  const { jobs } = await readStore();

  if (jobs.length === 0) return includeDrafts ? [] : DEFAULT_JOBS;

  const sorted = [...jobs].sort((a, b) => a.sortOrder - b.sortOrder);
  return includeDrafts ? sorted : sorted.filter((job) => job.status === 'published');
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
  // fileUrl is absolute where the host serves blobs itself, and a /uploads/…
  // path where the file comes back through this app.
  if (menu.fileUrl) return menu.fileUrl;
  if (menu.linkUrl) return menu.linkUrl;
  return content['site.menus_url'] || null;
}
