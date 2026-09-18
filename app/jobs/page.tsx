import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '../components/site-header';
import Announcement from '../components/announcement';
import { loadContent, loadJobs, telHref } from '../lib/content';
import { APPLICATION_EMAIL } from '../lib/defaults';
import ApplicationForm from './application-form';

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  const title = `Jobs at ${content['site.wordmark_lead']} | Saint Albans, Vermont`;
  const description = `Explore open positions at ${content['site.name']} in downtown Saint Albans. View shifts, responsibilities, benefits, and how to apply.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', images: ['/og.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
  };
}

export default async function Jobs() {
  const [content, openings] = await Promise.all([loadContent(), loadJobs()]);
  const phoneHref = telHref(content);

  return (
    <main id="main-content" className="jobs-page">
      <a className="skip-link" href="#open-positions">Skip to open positions</a>
      <Announcement content={content} />
      <SiteHeader content={content} isJobs />

      <section className="jobs-intro section-pad" aria-labelledby="jobs-title">
        <div>
          <Link className="text-link text-link-light" href="/">Back to Jeff&apos;s</Link>
          <h1 id="jobs-title">Join the team<br />at Jeff&apos;s.</h1>
          <p>We&apos;re hiring in downtown Saint Albans. Find your place in the kitchen with a fun, experienced team.</p>
          <a className="button button-light" href="#open-positions">View open positions</a>
        </div>
        <figure className="jobs-photo">
          <img src={content['spaces.one_image']} alt={content['spaces.one_alt']} width="1200" height="900" />
          <figcaption>65 North Main Street · Saint Albans, Vermont</figcaption>
        </figure>
      </section>

      <section className="jobs-openings section-pad" id="open-positions" aria-labelledby="openings-title">
        <div className="jobs-section-heading">
          <h2 id="openings-title">Open positions</h2>
          <p>Uniforms and paid time off are provided. The restaurant is closed Sundays and Mondays.</p>
        </div>

        {openings.length === 0 ? (
          <p className="jobs-empty">
            There are no openings posted right now. Check back soon, or call us at{' '}
            <a href={phoneHref}>{content['site.phone_display']}</a>.
          </p>
        ) : (
          openings.map((job) => (
            <article className="job-opening" id={job.id} key={job.id} aria-labelledby={`${job.id}-title`}>
              <div className="job-summary">
                <h3 id={`${job.id}-title`}>{job.title}</h3>
                <p className="job-schedule">{job.schedule}</p>
                <p>{job.experience}</p>
              </div>
              <div className="job-details">
                <h4>What you&apos;ll do</h4>
                <ul>{job.duties.map((duty) => <li key={duty}>{duty}</li>)}</ul>
                {job.applyUrl ? (
                  <a className="button job-apply" href={job.applyUrl} target="_blank" rel="noreferrer">
                    Apply for {job.title}
                  </a>
                ) : (
                  <a className="button job-apply" href="#apply">Apply for {job.title}</a>
                )}
              </div>
            </article>
          ))
        )}

      </section>

      <ApplicationForm openings={openings} recipient={APPLICATION_EMAIL} />

      <footer className="jobs-footer">
        <Link className="wordmark" href="/" aria-label={`${content['site.name']} home`}>
          <span>{content['site.wordmark_lead']}</span>
          <small>{content['site.wordmark_small']}</small>
        </Link>
        <Link href="/#visit">Visit the restaurant</Link>
        <a href={phoneHref}>{content['site.phone_display']}</a>
        <span>© {new Date().getFullYear()} {content['site.name']}</span>
      </footer>
    </main>
  );
}
