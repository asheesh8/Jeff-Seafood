import type { Metadata } from 'next';
import './admin.css';
import { isSignedIn } from '../lib/auth';
import { getStorageStatus } from '../lib/store';
import { loadContent, loadJobs, loadMenus } from '../lib/content';
import { CONTENT_GROUPS } from '../lib/defaults';
import SignIn from './sign-in';
import Panel from './panel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function Admin() {
  if (!(await isSignedIn())) return <SignIn />;

  const [content, menus, jobs, storage] = await Promise.all([
    loadContent(),
    loadMenus({ includeDrafts: true }),
    loadJobs({ includeDrafts: true }),
    getStorageStatus(),
  ]);

  return (
    <Panel
      groups={CONTENT_GROUPS}
      content={content}
      menus={menus}
      jobs={jobs}
      storage={storage}
    />
  );
}
