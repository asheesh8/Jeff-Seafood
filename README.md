# Jeff's Seafood

Website for Jeff's Seafood in Saint Albans, Vermont — menus, announcements and a jobs page with an application form — plus a password-protected `/admin` panel where the restaurant edits its own wording, menus and job postings.

**Live:** https://jeff-seafood-nine.vercel.app

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS 4
- Content lives in one JSON document instead of hard-coded arrays, behind a small storage driver (`app/lib/store/`):
  - **Vercel Blob** in production on Vercel
  - **Cloudflare R2** when built for Cloudflare Workers (`vinext`)
  - **local disk** in development
- `app/lib/defaults.ts` holds the built-in content, so the public site renders even before any storage is configured.

## Project layout

```
app/page.tsx, app/jobs/      Public pages
app/admin/                   Admin panel (sign-in, content, menus, jobs)
app/lib/content.tsx          Reads content with defaults filled in
app/lib/store/               Storage drivers (Vercel Blob, R2, local disk)
app/uploads/[...key]/        Serves uploaded files for hosts without public URLs
ADMIN.md                     Hand-over guide for setting up and using the admin panel
```

## Local setup

Requires Node 22.13+.

```bash
npm install
npm run dev        # Next.js dev server, local-disk storage
npm run lint
npm run dev:cf     # optional: run the Cloudflare Workers build locally
```

## Environment variables

Names only — set values in the hosting project's settings. See `ADMIN.md` for details.

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Password for `/admin`. Set this before the site goes live. |
| `ADMIN_SESSION_SECRET` | Optional separate secret for signing the admin session cookie |
| `BLOB_READ_WRITE_TOKEN` | Injected by Vercel when a Blob store is attached; stores content and uploads |

On Cloudflare the same names are bindings, plus an R2 bucket bound as `MEDIA`.

## Deploying

- **Vercel (default):** `vercel.json` pins the framework to Next.js (the repo also has a `vite.config.ts` for Cloudflare). Attach a Blob store, set `ADMIN_PASSWORD`, redeploy. Pushes to `main` go to production.
- **Cloudflare Workers:** `npm run build:cf`, with the R2 bucket bound as `MEDIA`.

Full steps are in [`ADMIN.md`](ADMIN.md).
