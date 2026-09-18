import type { Metadata } from 'next';
import './globals.css';
import { loadContent } from './lib/content';
import { announcementActive } from './components/announcement';

// Content lives in D1 and is edited from /admin, so pages are rendered per
// request. Saving in the admin shows up on the next page load — no redeploy.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  const name = content['site.name'];
  const title = `${name} | Saint Albans, Vermont`;
  const description = content['site.seo_description'];
  const social = 'Ocean fresh. Vermont rooted. Join us beside Taylor Park in historic downtown Saint Albans.';

  return {
    metadataBase: new URL('https://jeffsmaineseafood.com'),
    title,
    description,
    icons: { icon: '/favicon.png' },
    openGraph: {
      title,
      description: social,
      type: 'website',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: `${name} — Ocean fresh. Vermont rooted.` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: social,
      images: ['/og.png'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await loadContent();

  return (
    <html lang="en">
      <body data-announce={announcementActive(content) ? 'on' : undefined}>{children}</body>
    </html>
  );
}
