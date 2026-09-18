# Admin panel — setup & handover

The site now reads its wording, photos, menus, and job postings from a database
instead of from hardcoded arrays, and ships a password-protected panel at
`/admin` where the restaurant edits all of it.

## Before it can save anything

Two Cloudflare bindings and one secret are needed. Until they exist the public
site still renders perfectly — it falls back to the built-in defaults in
[`app/lib/defaults.ts`](app/lib/defaults.ts) — and `/admin` shows a banner
explaining that saving is off. Nothing breaks in the meantime.

**1. Provision D1 and R2.** `.openai/hosting.json` now names them:

```json
{ "project_id": "…", "d1": "DB", "r2": "MEDIA" }
```

Those two fields were `null` before. The OpenAI Sites platform reads this file
to decide what to provision, so the bindings appear on the next deploy. If a
deploy ever fails complaining about them, set both back to `null` — the site
keeps working on defaults, and only the admin's save function is lost.

The tables (`content`, `menus`, `jobs`) create themselves on first use, so there
is no migration to run.

**2. Set the admin password** as a secret on the deployed project:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

Optionally also set `ADMIN_SESSION_SECRET`. If you skip it, session cookies are
signed with `ADMIN_PASSWORD` instead — which works, but means changing the
password signs everyone out.

Make the password long. It is a single shared password with no lockout, so
length is the only thing protecting it. Sign-in sessions last 12 hours.

**3. Local development** uses `.dev.vars` (gitignored, already created):

```
ADMIN_PASSWORD=local-dev-password
ADMIN_SESSION_SECRET=local-dev-session-secret-change-me
```

`npm run dev` gives you a local D1 and R2 through Miniflare, stored under
`.wrangler/state/`. Delete that folder to reset your local content.

## How the content layer works

`app/lib/defaults.ts` is the single source of truth. It holds:

- `CONTENT_GROUPS` — the field definitions that **generate the admin forms**.
  Deliberately trimmed to two groups (announcement bar, hours & visiting), since
  those plus menus and jobs are the only things the restaurant edits. Add a group
  or a field there and it appears in the panel automatically; no UI code to
  touch, though new sidebar entries go in `app/admin/panel.tsx`.
- `DEFAULT_CONTENT` — the value every field falls back to, matching what the
  site said before this change.
- `DEFAULT_MENUS` / `DEFAULT_JOBS` — shown until the owners save their own.

`loadContent()` merges saved rows over the defaults. A field cleared in the
admin falls back to its default rather than leaving a hole in the page, and the
per-section **Restore original wording** button just deletes those rows.

Pages are `force-dynamic`, so a save is live on the next page load — no deploy,
no cache to clear.

## Job applications

The Jobs page carries an application form
([`app/jobs/application-form.tsx`](app/jobs/application-form.tsx)). There is no
mail service behind it and nothing is stored or sent server-side: on submit it
builds a Gmail compose URL and opens it in a new tab with the subject and body
already written, addressed to `APPLICATION_EMAIL` in `app/lib/defaults.ts`
(currently `jamestjehle@gmail.com`). The applicant presses Send themselves,
which also lets them attach a résumé to the same message.

A secondary "use my own email app" button does the same thing as a `mailto:`
link, for applicants who are not Gmail users.

Consequences worth knowing:

- **Nothing is captured if the applicant abandons the compose window.** There is
  no record of a half-finished application, by design.
- **Applications arrive from the applicant's own address**, so replying works
  normally.
- A job posting's optional "Apply button link" overrides this and sends people
  to an external URL instead. Both built-in postings leave it empty.

## Uploads

Menu files and photos go to R2 under a content-addressed key and are served by
[`app/uploads/[...key]/route.ts`](app/uploads/%5B...key%5D/route.ts) with a
one-year immutable cache. Because the key is a hash of the file, replacing a
photo produces a new URL instead of a stale cached one.

Limits: 10 MB, and JPG / PNG / WEBP / GIF / AVIF / PDF only.

## What is not editable

The panel covers four things: the announcement bar, menus, jobs, and hours &
visiting. Everything else on the site renders from `DEFAULT_CONTENT` and is
changed in code.

That includes all the photos (hero, story, lounge, the room grid), the hero
headline and intro, the welcome, story, gather and restaurant sections, the
phone number, social links and footer, and the VermontBiz awards table.

All of it is still keyed and wired through the content layer, so re-exposing any
of it is a matter of pasting its group definition back into `CONTENT_GROUPS` and
adding a line to `SECTIONS` in `app/admin/panel.tsx` — the forms and the save
path already work. Earlier revisions of `defaults.ts` have the group definitions
if you want them back verbatim.

Note that `Maine` still appears inside the Google Maps and Tripadvisor URLs.
Those are external identifiers, not branding — editing them breaks the links.

## Worth knowing

- `/admin` is `noindex, nofollow`, but it is not hidden — anyone who finds the
  URL sees the password prompt. That is the same model as the reference site.
- There is no rate limiting on sign-in, only a 400 ms delay on a wrong password.
  If this needs hardening later, a `failed_attempts` table in D1 keyed by IP is
  the natural next step.
- Deleting a menu removes the database row but leaves its file in R2. Harmless,
  but a periodic sweep would be tidy if they churn through a lot of menus.
