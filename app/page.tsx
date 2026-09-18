import Link from 'next/link';
import SiteHeader from './components/site-header';
import Announcement from './components/announcement';
import { loadContent, loadMenus, menuHref, telHref, toLines, toPairs, withBreaks } from './lib/content';

// Awards are a matter of public record rather than day-to-day content, so they
// stay in code. Everything the restaurant changes itself comes from /admin.
const awards = [
  {
    title: 'Best Restaurant for Business Lunch',
    years: ['2017', '2018', '2019', '2020', '2022', '2024', '2025'],
    sourceLabel: 'View 2025 winners',
    href: 'https://vermontbiz.com/news/2025/may/26/2025-bob-awards-best-business',
  },
  {
    title: 'Best Restaurant for Business Dinner',
    years: ['2018', '2019', '2021', '2023', '2024', '2026'],
    sourceLabel: 'View 2026 winners',
    href: 'https://vermontbiz.com/news/2026/may/18/2026-best-business-vermont-recipients-announced',
  },
  {
    title: 'Best Small/Medium Venue for Meetings & Events',
    years: ['2025'],
    sourceLabel: 'View 2025 winners',
    href: 'https://vermontbiz.com/news/2025/may/26/2025-bob-awards-best-business',
  },
];

const tripadvisorHref =
  'https://www.tripadvisor.com/Restaurant_Review-g57385-d1968473-Reviews-Jeff_s_Maine_Seafood-Saint_Albans_Vermont.html';

export default async function Home() {
  const [content, menus] = await Promise.all([loadContent(), loadMenus()]);

  const phoneHref = telHref(content);
  const mapsHref = content['site.maps_url'];
  const contactHref = content['site.contact_url'];
  const name = content['site.name'];

  const onlineConnections = [
    { name: 'Tripadvisor', note: 'Read traveler reviews', href: tripadvisorHref },
    { name: 'Facebook', note: 'News & restaurant updates', href: content['site.facebook_url'] },
    {
      name: 'VermontBiz',
      note: 'See the 2025 winners',
      href: 'https://vermontbiz.com/news/2025/may/26/2025-bob-awards-best-business',
    },
  ];

  return (
    <main id="main-content">
      <a className="skip-link" href="#welcome">Skip to content</a>
      <Announcement content={content} />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true">
          <img src={content['hero.image']} alt="" />
          <div className="hero-veil" />
        </div>

        <SiteHeader content={content} />

        <p className="hero-location">{content['hero.location']}</p>

        <div className="hero-copy">
          <p className="eyebrow eyebrow-light">{content['hero.eyebrow']}</p>
          <h1 id="hero-title">{withBreaks(content['hero.title'])}</h1>
          <p className="hero-intro">{content['hero.intro']}</p>
          <div className="hero-actions">
            <a className="button button-light" href="#menus">{content['hero.cta_label']}</a>
            <a className="text-link text-link-light" href={phoneHref}>
              Call {content['site.phone_display']} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="hero-hours" aria-label="Restaurant hours">
          <span>{content['hero.hours_days']}</span>
          <strong>{content['hero.hours_times']}</strong>
        </div>
        <a className="hero-scroll" href="#welcome" aria-label="Scroll to restaurant introduction">
          Scroll <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="welcome section-pad" id="welcome">
        <div>
          <p className="eyebrow">{content['welcome.eyebrow']}</p>
          <h2>{withBreaks(content['welcome.heading'])}</h2>
        </div>
        <div className="welcome-copy">
          <p>{content['welcome.body']}</p>
          <a className="text-link" href="#story">
            {content['welcome.link_label']} <span aria-hidden="true">↘</span>
          </a>
        </div>
        <div className="welcome-proof" aria-label="Restaurant facts">
          {toPairs(content['welcome.proof']).map((fact) => (
            <div key={fact.lead}>
              <strong>{fact.lead}</strong>
              <span>{fact.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="menu-section section-pad" id="menus">
        <div className="section-heading section-heading-light">
          <div>
            <p className="eyebrow eyebrow-light">{content['menus.eyebrow']}</p>
            <h2>{withBreaks(content['menus.heading'])}</h2>
          </div>
          <div className="section-heading-copy">
            <p>{content['menus.body']}</p>
            <p className="menu-note">{content['menus.note']}</p>
          </div>
        </div>

        <div className="menu-layout">
          <div className="menu-ledger">
            {menus.map((menu, index) => {
              const href = menuHref(menu, content);
              const body = (
                <>
                  <span className="menu-row-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{menu.title}</h3>
                    <p>{menu.blurb}</p>
                  </div>
                  <span className="menu-row-mark" aria-hidden="true">✦</span>
                </>
              );

              return href ? (
                <a
                  className="menu-row menu-row-link"
                  key={menu.id}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {body}
                </a>
              ) : (
                <article className="menu-row" key={menu.id}>{body}</article>
              );
            })}
          </div>

          <aside className="menu-media">
            <img src={content['menus.image']} alt={content['menus.image_alt']} />
            <div className="menu-media-caption">
              <span>{content['menus.caption_label']}</span>
              <p>{content['menus.caption_text']}</p>
            </div>
            <a
              className="button button-coral"
              href={content['site.menus_url']}
              target="_blank"
              rel="noreferrer"
            >
              View lunch &amp; dinner menus
            </a>
          </aside>
        </div>
      </section>

      <section className="story-section section-pad" id="story">
        <div className="story-media">
          <img src={content['story.image']} alt={content['story.image_alt']} />
          <span className="story-stamp">{withBreaks(content['story.stamp'])}</span>
        </div>

        <div className="story-copy">
          <p className="eyebrow">{content['story.eyebrow']}</p>
          <h2>{withBreaks(content['story.heading'])}</h2>
          <p className="story-lede">{content['story.lede']}</p>
          <p>{content['story.body']}</p>

          <div className="history-line" aria-label={`${name} timeline`}>
            {toPairs(content['story.timeline']).map((entry) => (
              <div key={entry.lead}>
                <strong>{entry.lead}</strong>
                <span>{entry.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="private-section" aria-labelledby="private-title">
        <img src={content['gather.image']} alt={content['gather.image_alt']} />
        <div className="private-veil" />
        <div className="private-copy">
          <p className="eyebrow eyebrow-light">{content['gather.eyebrow']}</p>
          <h2 id="private-title">{withBreaks(content['gather.heading'])}</h2>
          <p>{content['gather.body']}</p>
          <a className="button button-light" href={phoneHref}>{content['gather.cta_label']}</a>
        </div>
      </section>

      <section className="spaces-section section-pad" id="spaces">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{content['spaces.eyebrow']}</p>
            <h2>{withBreaks(content['spaces.heading'])}</h2>
          </div>
          <div className="section-heading-copy">
            <p>{content['spaces.body']}</p>
          </div>
        </div>

        <div className="space-grid">
          <figure className="space-card space-card-wide">
            <img src={content['spaces.one_image']} alt={content['spaces.one_alt']} />
            <figcaption><span>01</span>{content['spaces.one_caption']}</figcaption>
          </figure>
          <figure className="space-card space-card-food">
            <img src={content['spaces.two_image']} alt={content['spaces.two_alt']} />
            <figcaption><span>02</span>{content['spaces.two_caption']}</figcaption>
          </figure>
          <figure className="space-card space-card-lounge">
            <img src={content['spaces.three_image']} alt={content['spaces.three_alt']} />
            <figcaption><span>03</span>{content['spaces.three_caption']}</figcaption>
          </figure>
        </div>
      </section>

      <section className="recognition-section section-pad" id="recognition" aria-labelledby="recognition-title">
        <div className="recognition-intro">
          <h2 id="recognition-title">Recognized in Vermont. Recommended by travelers.</h2>
          <p>
            VermontBiz readers have recognized Jeff&apos;s for business lunches, dinners, and
            gatherings across Franklin, Grand Isle, and Addison counties.
          </p>
        </div>

        <div className="award-ledger" aria-label="VermontBiz Best of Business awards">
          <div className="award-ledger-header" aria-hidden="true">
            <span>VermontBiz Best of Business</span>
            <span>Winning years</span>
            <span>Results</span>
          </div>
          {awards.map((award) => (
            <a className="award-row" href={award.href} target="_blank" rel="noreferrer" key={award.title}>
              <strong>{award.title}</strong>
              <span className="award-years">{award.years.join(' · ')}</span>
              <span className="award-source">{award.sourceLabel}</span>
            </a>
          ))}
        </div>

        <nav className="recognition-connections" aria-label={`Find ${name} online`}>
          <p>Stay connected</p>
          {onlineConnections.map((connection) => (
            <a href={connection.href} target="_blank" rel="noreferrer" key={connection.name}>
              <strong>{connection.name}</strong>
              <span>{connection.note}</span>
            </a>
          ))}
        </nav>
      </section>

      <section className="visit-section section-pad" id="visit">
        <div className="visit-heading">
          <p className="eyebrow eyebrow-light">{content['visit.eyebrow']}</p>
          <h2>{withBreaks(content['visit.heading'])}</h2>
        </div>

        <div className="visit-grid">
          <div>
            <p className="visit-label">Reservations</p>
            <a className="visit-primary" href={phoneHref}>{content['site.phone_display']}</a>
            <p>{content['visit.reservations_note']}</p>
          </div>
          <div>
            <p className="visit-label">Hours</p>
            <p>
              <strong>{content['visit.hours_open_days']}</strong><br />
              {content['visit.hours_open_times']}
              {toLines(content['visit.hours_extra']).map((note) => (
                <span key={note}><br />{note}</span>
              ))}
            </p>
            <p>
              <strong>{content['visit.hours_closed_days']}</strong><br />
              {content['visit.hours_closed_note']}
            </p>
          </div>
          <div>
            <p className="visit-label">Find us</p>
            <address>{withBreaks(content['visit.address'])}</address>
            <a className="text-link text-link-light" href={mapsHref} target="_blank" rel="noreferrer">
              Open directions <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="visit-actions">
          <a className="button button-light" href={phoneHref}>Reserve by phone</a>
          <a className="button button-outline" href={contactHref} target="_blank" rel="noreferrer">
            Contact the restaurant
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/brand/jeffs-logo.png" alt={name} />
          <p>{content['site.footer_tagline']}</p>
        </div>

        <div className="footer-links">
          <div>
            <p className="visit-label">Explore</p>
            <a href="#menus">Menus</a>
            <a href="#story">Our story</a>
            <a href="#spaces">The restaurant</a>
            <a href="#visit">Visit</a>
            <Link href="/jobs">Jobs at Jeff&apos;s</Link>
          </div>
          <div>
            <p className="visit-label">Connect</p>
            <a href={phoneHref}>{content['site.phone_display']}</a>
            <a href={contactHref} target="_blank" rel="noreferrer">Contact us</a>
            <a href={content['site.facebook_url']} target="_blank" rel="noreferrer">Facebook ↗</a>
            <a href={content['site.instagram_url']} target="_blank" rel="noreferrer">Instagram ↗</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {name}</span>
          <span>Saint Albans, Vermont</span>
          <span>{content['site.footer_note']}</span>
        </div>
      </footer>

      <nav className="mobile-actions" aria-label="Quick actions">
        <a href={phoneHref}>Call &amp; reserve</a>
        <a href={mapsHref} target="_blank" rel="noreferrer">Directions</a>
      </nav>
    </main>
  );
}
