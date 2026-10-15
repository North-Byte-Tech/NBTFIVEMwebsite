# fmrp-web

Next.js (App Router, TypeScript) community website — landing/rules,
department information and recruitment, and an admin dashboard, all as one
app gated by session + permission checks. Deployed to Vercel. Fully
self-contained: this app's own Postgres database is the only datastore -
there is no separate backend service anymore.

## Accounts and login

Signing in with Discord creates a real website account in this app's own
Postgres database (`prisma/schema.prisma`, via `@next-auth/prisma-adapter`).
That account row is the single source of truth for everything: staff
status, permissions, bans, notes, and application history all live here.

### Bootstrapping the first admin

`/admin` is gated on `fmrp.staff.admin`, managed entirely through the
`/admin` UI once at least one admin exists. To get the very first admin,
set `ADMIN_BOOTSTRAP_DISCORD_IDS` (see `.env.example`) to your Discord user
id before signing in - `lib/auth.ts`'s `events.signIn` grants
`fmrp.staff.admin` to any listed id automatically and idempotently. It's
safe to leave set permanently for whoever should always have admin;
everyone else's access should be granted through the admin UI instead.

**Current feature set**: public pages (landing, rules, how-to-join,
department overview/detail), a recruitment application form per department
(`/departments/[slug]/apply`, posting to `/api/applications`, which
requires only a signed-in session). The SAFD site is linked at
`https://fire.fmrp.gg`; other department sites can be added when their URLs
are ready. Live game-server status reporting is not included yet and can be
added later. Department pages only link to `/apply` when that
department's application type is active (`lib/applicationTypes.ts`) -
manage recruitment availability from the Department Decisions or Form
Builder tools; the apply route itself works regardless, for testing. The admin dashboard
(`/admin/*`) covers staff roster, bans, player notes, permissions, the
applications review queue, and a staff-action audit log - see
`lib/adminData.ts` for all of it.

The admin dashboard also includes:

- **Doc Center** (`/admin/docs`): a staff knowledge base. Admins write
  Markdown articles (the `Doc` table, `lib/docs.ts`) alongside read-only
  built-in articles that ship with the code (`lib/builtinDocs.ts`).
- **Dev Dashboard** (`/admin/dev`): runtime, configuration, database
  (latency, row counts, applied/pending migrations) and Discord bot health.
  It needs `fmrp.staff.developer` on top of `fmrp.staff.admin`. IDs in
  `ADMIN_BOOTSTRAP_DISCORD_IDS` get both.

### No-login host

Requests whose `Host` is listed in `AUTH_BYPASS_HOSTS` (default
`fmrp.northbytetech.com`) skip Discord sign-in entirely. Every visitor there
is a "Guest Admin" with full admin access, but not the Dev Dashboard, and
can't submit applications. Set `AUTH_BYPASS_HOSTS=` (empty) to turn it off.

## Local setup

1. Get a local Postgres running (e.g. `postgres.app`, Docker, or your
   package manager) and create a database for this app, e.g. `fmrp_web`.
2. Create a Discord application at
   https://discord.com/developers/applications, OAuth2 tab: add redirect
   URI `http://localhost:3000/api/auth/callback/discord`, copy the Client
   ID and Client Secret.
3. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL`,
   `NEXTAUTH_SECRET` (any random string), and the Discord client id/secret.
   Set `ADMIN_BOOTSTRAP_DISCORD_IDS` to your own Discord id so you land as
   admin on first sign-in.
4. `pnpm install` (from repo root) — this also runs `prisma generate`.
   Then create the database tables:
   `pnpm --filter fmrp-web exec prisma migrate deploy`.
5. `pnpm --filter fmrp-web dev` and open http://localhost:3000.

For quick UI iteration without any of the above, set `DEV_BYPASS_AUTH`
(unset/anything but `"false"` in non-production) - every page renders as a
fixed fake signed-in admin session with zero Postgres/Discord setup. See
`lib/session.ts`.

## Deploying to Vercel

1. Provision a Postgres database (Vercel Postgres, Neon, or Supabase all
   work — pick whichever, this is a plain Postgres connection string, no
   provider-specific features used).
2. Import this repo into a new Vercel project, set its **Root Directory**
   to `web`.
3. Set the same env vars as `.env.example` in the Vercel project settings
   (`DATABASE_URL` = your Postgres connection string, `NEXTAUTH_URL` = your
   real production domain).
4. Run `prisma migrate deploy` against that `DATABASE_URL` once (locally,
   with it set in your shell, or from a secure one-off command) to create the
   tables before the first deploy. This applies the latest schema, including
   removal of the unused game-server status table.
5. Add a second Discord OAuth redirect URI for the production domain:
   `https://<your-domain>/api/auth/callback/discord`.
