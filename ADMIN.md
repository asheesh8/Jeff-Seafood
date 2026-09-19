# Admin panel — setup & handover

The site reads its wording, menus, and job postings from a small JSON document
instead of from hardcoded arrays, and ships a password-protected panel at
`/admin` where the restaurant edits them.

It deploys to **Vercel** (the default) and still deploys to **Cloudflare
Workers**. Same code, same data shape; only the storage driver differs.

## Deploying to Vercel

1. **Import the repo** at [vercel.com/new](https://vercel.com/new) — pick
   `asheesh8/Jeff-Seafood`. `vercel.json` pins the framework to Next.js, so no
   build settings need changing. (The repo also contains a `vite.config.ts` for
   the Cloudflare target; without that pin Vercel could mistake this for a Vite
   app.)

2. **Add a Blob store.** Project → Storage → Create → Blob. Vercel injects
   `BLOB_READ_WRITE_TOKEN` automatically. This holds both the content document
   and the uploaded menu files.

3. **Redeploy** so the Blob token is picked up.

Until step 2 is done the public site still renders perfectly on its built-in
defaults, and `/admin` explains what is missing. Nothing breaks in the meantime.

## The admin password

Out of the box the panel accepts a **demo password: `YUMJEFFSEAFOOD`**, so it is
usable the moment the site deploys, with nothing to configure.

That password is in this repository's source, and the repository is public — so
it is public knowledge, and anyone who finds `/admin` can edit the site. It also
signs the session cookie, so knowing it is enough to forge a session. Fine for
showing the panel to the client; not fine once the site is real.

**To replace it**, add an environment variable on the hosting project and
redeploy:

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | a long passphrase |
| `ADMIN_SESSION_SECRET` | any long random string (optional) |

Setting `ADMIN_PASSWORD` takes over completely: the demo password stops working,
every existing session is invalidated (the cookie signing key changes with it),
and the warning banner inside the panel disappears. No code change needed.

Skipping the session secret is fine — cookies are then signed with the password
instead, which is why changing the password signs everyone out.

## How the content layer works

`app/lib/defaults.ts` is the source of truth:

- `CONTENT_GROUPS` — field definitions that **generate the admin forms**.
  Deliberately trimmed to two groups (announcement bar, hours & visiting), since
  those plus menus and jobs are the only things the restaurant edits. Add a
  group or field there and it appears in the panel automatically; new sidebar
  entries go in `app/admin/panel.tsx`.
- `DEFAULT_CONTENT` — the value every field falls back to, matching what the
  site said before any of this existed.
- `DEFAULT_MENUS` / `DEFAULT_JOBS` — shown until the owners save their own.

Saved values are layered over the defaults at render time. A field cleared in
the admin falls back to its default rather than leaving a hole in the page, and
**Restore original wording** simply drops those keys.

Pages are `force-dynamic`, so a save is live on the next page load — no deploy,
no cache to clear.

### Storage

Everything editable lives in one document at `site/data.json`:

```jsonc
{
  "content": { "announcement.text": "…" },  // only keys that differ from default
  "menus":   [ { "id": "lunch", "fileUrl": "…", "sortOrder": 1, … } ],
  "jobs":    [ … ],
  "updatedAt": "2026-09-19T12:36:55.937Z"
}
```

There is no database. At this size — a few dozen strings and a handful of rows —
a document is a better fit: one read per request (deduped with React `cache`),
no schema to migrate, and the same shape on every host.

`app/lib/store/` picks a driver at runtime, first match wins:

| Driver | Chosen when | Uploads are served |
| --- | --- | --- |
| `cloudflare-r2` | the R2 binding exists (only on Workers) | through `/uploads/…` |
| `vercel-blob` | `BLOB_READ_WRITE_TOKEN` is set | absolute Blob URLs |
| `local-disk` | neither, and not production | through `/uploads/…` |
| none | neither, in production | — reads fall back to defaults |

The disk driver writes to `.data/` (gitignored) so the admin is fully usable
locally with `npm run dev` and no cloud account. It is never selected in
production, so a misconfigured deploy falls back to defaults rather than
silently writing to a container that disappears.

**One caveat with the document model:** saves are last-write-wins. If two people
edit different sections at the same moment, the later save wins and the earlier
one is lost. With one or two people editing a restaurant website this has never
mattered, but it is the trade-off against a real database.

## Deploying to Cloudflare (still supported)

`npm run build:cf` / `npm run dev:cf` use vinext. `.openai/hosting.json` names
the `MEDIA` R2 bucket; provision it and set the real password with
`npx wrangler secret put ADMIN_PASSWORD`. D1 is no longer used.

## Job applications

The Jobs page carries an application form
([`app/jobs/application-form.tsx`](app/jobs/application-form.tsx)). There is no
mail service behind it and nothing is stored or sent server-side: on submit it
builds a Gmail compose URL and opens it in a new tab with the subject and body
already written, addressed to `APPLICATION_EMAIL` in `app/lib/defaults.ts`
(currently `jamestjehle@gmail.com`). The applicant presses Send themselves,
which also lets them attach a résumé to the same message.

A secondary "use my own email app" button does the same as a `mailto:` link, for
applicants who are not Gmail users.

- **Nothing is captured if the applicant abandons the compose window.** There is
  no record of a half-finished application, by design.
- **Applications arrive from the applicant's own address**, so replying works.
- A posting's optional "Apply button link" overrides this and sends people to an
  external URL instead. Both built-in postings leave it empty.

## Uploads

Menu files and photos are stored under a content-addressed key (a hash of the
file), so replacing one produces a new URL instead of a stale cached copy.

Limits: 10 MB, and JPG / PNG / WEBP / GIF / AVIF / PDF only.

## What is not editable

The panel covers four things: the announcement bar, menus, jobs, and hours &
visiting. Everything else renders from `DEFAULT_CONTENT` and is changed in code.

That includes all the photos (hero, story, lounge, the room grid), the hero
headline and intro, the welcome, story, gather and restaurant sections, the
phone number, social links and footer, and the VermontBiz awards table.

All of it is still keyed through the content layer, so re-exposing any of it is
a matter of pasting its group definition back into `CONTENT_GROUPS` and adding a
line to `SECTIONS` in `app/admin/panel.tsx` — the forms and the save path
already work.

Note that `Maine` still appears inside the Google Maps and Tripadvisor URLs.
Those are external identifiers, not branding — editing them breaks the links.

## Worth knowing

- `/admin` is `noindex, nofollow`, but it is not hidden — anyone who finds the
  URL sees the password prompt.
- There is no rate limiting on sign-in, only a 400 ms delay on a wrong password.
  Make the real password long. If this needs hardening, a counter keyed by IP in
  the same document is the natural next step.
- Deleting a menu removes it from the document but leaves its file in storage.
  Harmless, but a periodic sweep would be tidy.
- Vercel Blob is a public store: anyone with the URL of an uploaded menu can
  read it. That is the same exposure as any file linked from the site.
