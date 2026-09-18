'use client';

import { useState } from 'react';
import type { JobItem } from '../lib/defaults';

/**
 * Collects an application and hands it to the applicant's own mail client with
 * everything already typed out. Nothing is sent from the server and nothing is
 * stored — the applicant presses Send themselves, which also lets them attach a
 * résumé to the same message.
 */
export default function ApplicationForm({
  openings,
  recipient,
}: {
  openings: JobItem[];
  recipient: string;
}) {
  const [sent, setSent] = useState(false);

  function compose(event: React.FormEvent<HTMLFormElement>, target: 'gmail' | 'mail') {
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) ?? '').trim();

    const position = value('position');
    const name = value('name');

    const subject = `Job application — ${position} — ${name}`;
    const body = [
      `Position: ${position}`,
      `Name: ${name}`,
      `Phone: ${value('phone')}`,
      `Email: ${value('email')}`,
      `Availability: ${value('availability') || 'Not specified'}`,
      '',
      'About me:',
      value('about') || 'Not specified',
      '',
      '—',
      'Sent from the jobs page on the Jeff’s Seafood website.',
    ].join('\n');

    const url =
      target === 'gmail'
        ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        : `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    setSent(true);
  }

  return (
    <section className="apply-section" id="apply" aria-labelledby="apply-title">
      <div className="apply-heading">
        <h2 id="apply-title">Apply</h2>
        <p>
          Fill this in and we will open an email to the restaurant with your answers already written
          out. Check it over, attach your résumé if you have one, and press send.
        </p>
      </div>

      <form
        className="apply-form"
        onSubmit={(event) => {
          event.preventDefault();
          compose(event, 'gmail');
        }}
      >
        <div className="apply-field">
          <label htmlFor="position">Position you want</label>
          <select id="position" name="position" defaultValue={openings[0]?.title ?? 'Any position'}>
            {openings.map((job) => (
              <option key={job.id} value={job.title}>{job.title}</option>
            ))}
            <option value="Any position">Any position</option>
          </select>
        </div>

        <div className="apply-field">
          <label htmlFor="name">Your name</label>
          <input id="name" name="name" type="text" autoComplete="name" required />
        </div>

        <div className="apply-pair">
          <div className="apply-field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" required />
          </div>
          <div className="apply-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
        </div>

        <div className="apply-field">
          <label htmlFor="availability">When can you work?</label>
          <input
            id="availability"
            name="availability"
            type="text"
            placeholder="Weekday evenings, weekends, any shift…"
          />
        </div>

        <div className="apply-field">
          <label htmlFor="about">Anything you want us to know</label>
          <textarea
            id="about"
            name="about"
            rows={5}
            maxLength={1500}
            placeholder="Previous kitchen experience, why you'd like to join, when you could start…"
          />
        </div>

        <div className="apply-actions">
          <button className="button job-apply" type="submit">Open email to apply</button>
          <button
            className="text-link apply-alt"
            type="submit"
            formNoValidate={false}
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (!form?.reportValidity()) return;
              event.preventDefault();
              compose(
                { currentTarget: form, preventDefault: () => {} } as unknown as React.FormEvent<HTMLFormElement>,
                'mail',
              );
            }}
          >
            Use my own email app instead
          </button>
        </div>

        {sent ? (
          <p className="apply-sent" role="status">
            Your email is open in a new tab. Press send there to finish your application — nothing
            reaches us until you do.
          </p>
        ) : null}
      </form>
    </section>
  );
}
