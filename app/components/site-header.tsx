import Link from 'next/link';
import type { Content } from '../lib/content';
import { telHref } from '../lib/content';

export default function SiteHeader({
  content,
  isJobs = false,
}: {
  content: Content;
  isJobs?: boolean;
}) {
  const home = isJobs ? '/' : '';
  const phone = telHref(content);
  const name = content['site.name'];

  return (
    <header className="site-header">
      <Link className="wordmark" href={`${home}#main-content`} aria-label={`${name} home`}>
        <span>{content['site.wordmark_lead']}</span>
        <small>{content['site.wordmark_small']}</small>
      </Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <Link href={`${home}#menus`}>Menus</Link>
        <Link href={`${home}#story`}>Our story</Link>
        <Link href={`${home}#spaces`}>The restaurant</Link>
        <Link href={`${home}#visit`}>Visit</Link>
        <Link href="/jobs" aria-current={isJobs ? 'page' : undefined}>Jobs</Link>
      </nav>
      <a className="header-cta" href={phone}>Reserve by phone</a>
      <details className="mobile-menu">
        <summary>Menu</summary>
        <nav aria-label="Mobile navigation">
          <Link href={`${home}#menus`}><span>01</span> Menus</Link>
          <Link href={`${home}#story`}><span>02</span> Our story</Link>
          <Link href={`${home}#spaces`}><span>03</span> The restaurant</Link>
          <Link href={`${home}#visit`}><span>04</span> Visit</Link>
          <Link href="/jobs" aria-current={isJobs ? 'page' : undefined}><span>05</span> Jobs</Link>
          <a href={phone}><span>06</span> Reserve by phone</a>
        </nav>
      </details>
    </header>
  );
}
