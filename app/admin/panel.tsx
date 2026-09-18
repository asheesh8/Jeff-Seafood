'use client';

import { useState } from 'react';
import { signOutAction } from './actions';
import type { Content } from '../lib/content';
import type { GroupDef, JobItem, MenuItem } from '../lib/defaults';
import type { StorageStatus } from '../lib/db';
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
        {!storage.db ? (
          <div className="admin-banner">
            <h3>Saving is not switched on yet</h3>
            <p>
              The site is running on its built-in wording, which is why everything below already
              looks right. Nothing you save here will stick until the content database is
              provisioned for this project.
            </p>
            <p>
              Whoever set the site up needs to provision the <code>DB</code> (D1) and{' '}
              <code>MEDIA</code> (R2) bindings named in <code>.openai/hosting.json</code>, then
              redeploy. The public site keeps working normally in the meantime.
            </p>
          </div>
        ) : null}

        {active === 'menus' ? (
          <MenusPanel menus={menus} canUpload={storage.bucket} />
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
