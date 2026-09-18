import type { Content } from '../lib/content';
import { isOn } from '../lib/content';

/**
 * Optional strip above the fixed site header. When it renders, the
 * `data-announce` attribute shifts the header down to make room for it.
 */
export default function Announcement({ content }: { content: Content }) {
  const text = content['announcement.text']?.trim();
  if (!isOn(content['announcement.enabled']) || !text) return null;

  const label = content['announcement.link_label']?.trim();
  const url = content['announcement.link_url']?.trim();

  return (
    <div className="announce">
      <p>{text}</p>
      {label && url ? (
        <a href={url} target={url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {label} <span aria-hidden="true">↗</span>
        </a>
      ) : null}
    </div>
  );
}

export function announcementActive(content: Content): boolean {
  return isOn(content['announcement.enabled']) && Boolean(content['announcement.text']?.trim());
}
