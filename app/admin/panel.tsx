'use client';

import { useState } from 'react';
import { signOutAction } from './actions';
import type { Content } from '../lib/content';
import type { GroupDef, JobItem, MenuItem } from '../lib/defaults';
import type { StorageStatus } from '../lib/store';
import ContentForm from './content-form';
import MenusPanel from './menus-panel';
import JobsPanel from './jobs-panel';
import HowTo from './how-to';

type Section = { id: string; label: string };

// Only the four things the restaurant changes week to week. The rest of the
// page keeps the wording it launched with.
const SECTIONS: Section[] = [
  { id: 'group:announcement', label: 'Announcement bar' },
  { id: 'menus', label: 'Menus' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'group:visit', label: 'Hours & visiting' },
  { id: 'how-to', label: 'How this works' },
];

export default function Panel({
  groups,
  content,
  menus,
  jobs,
  storage,
}: {
  groups: GroupDef[];
  content: Content;
  menus: MenuItem[];
  jobs: JobItem[];
  storage: StorageStatus;
}) {
  const [active, setActive] = useState('group:announcement');

  const group = active.startsWith('group:')
    ? groups.find((candidate) => candidate.id === active.slice('group:'.length))
    : undefined;

  return (
    <div className="admin-shell">
      <nav className="admin-side" aria-label="Admin sections">
        <span className="admin-brand">
          {content['site.wordmark_lead']}
          <small>Content panel</small>
        </span>

        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-current={active === section.id}
            onClick={() => setActive(section.id)}
          >
            {section.label}
          </button>
        ))}

        <div className="admin-side-foot">
          <a href="/" target="_blank" rel="noreferrer">View the site ↗</a>
          <form action={signOutAction}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </nav>

      <main className="admin-main">
        {!storage.ready ? (
          <div className="admin-banner">
            <h3>Saving is not switched on yet</h3>
            <p>
              The site is running on its built-in wording, which is why everything below already
              looks right. Nothing you save here will stick until storage is connected.
            </p>
            <p>
              On Vercel that means adding a Blob store to the project so{' '}
              <code>BLOB_READ_WRITE_TOKEN</code> is set; on Cloudflare it means provisioning the{' '}
              <code>MEDIA</code> R2 bucket. Either way the public site keeps working normally in the
              meantime.
            </p>
          </div>
        ) : null}

        {storage.demoPassword ? (
          <div className="admin-banner">
            <h3>This panel is using the demo password</h3>
            <p>
              The demo password is part of the site&apos;s public source code, so anyone can look it
              up and edit these pages. Fine while you are trying things out — not fine once the site
              is live.
            </p>
            <p>
              To fix it, set an <code>ADMIN_PASSWORD</code> environment variable on the hosting
              project and redeploy. This notice disappears once you do.
            </p>
          </div>
        ) : null}

        {active === 'menus' ? (
          <MenusPanel menus={menus} canUpload={storage.ready} />
        ) : active === 'jobs' ? (
          <JobsPanel jobs={jobs} />
        ) : active === 'how-to' ? (
          <HowTo />
        ) : group ? (
          <ContentForm key={group.id} group={group} content={content} />
        ) : null}
      </main>
    </div>
  );
}
