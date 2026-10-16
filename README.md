# San Andreas Metro RP Website

San Andreas Metro RP's public website, staff admin dashboard, and
emergency-department (LEO/SAFD/SAEMS) recruitment.

A pnpm workspace with two deployable services:

- [`web/`](web/) — Next.js (App Router) app, deployed to Vercel. Public
  site, player portal, admin dashboard, all gated by a Discord-OAuth
  session. Owns its own Postgres database (via Prisma — see
  `web/prisma/schema.prisma`) as its ONLY datastore: accounts, staff
  roster, bans, player notes, permissions, and applications all live there.
  Never touches the game's MySQL database.
- [`discord-bot/`](discord-bot/) — Express + discord.js process, ported from
  the game-server repo (`SFRP_Core`)'s `services/discord-bot` and deployed on
  the game-server host (it needs direct MySQL access for role sync). It can
  optionally send website recruitment notifications. See its README.

`portal-api/` (the Express service that used to bridge `web` to the FiveM
game server's MySQL database) has been retired - every feature it provided
(game-linked accounts, characters, staff/ban/permission/application
management) has been rebuilt directly on `web`'s own Postgres database. Its
source is kept at [`_archive/portal-api/`](_archive/portal-api/) for
reference only; it is not part of the running system and isn't deployed
anywhere. One consequence of the retirement: there's no more live link to
FiveM character data, so the player portal no longer shows a character
roster, and applying/using the portal no longer requires having connected
to the FiveM server first - any signed-in Discord user can.

See each service's README for local setup and deployment.

## Getting started

```bash
pnpm install
pnpm --filter fmrp-web dev          # terminal 1
pnpm --filter fmrp-discord-bot dev  # terminal 2 (optional, needs a Discord bot + game MySQL)
```

Each service needs its own `.env`/`.env.local` — copy `.env.example` in
each directory and fill in real values (see the respective READMEs). For
just iterating on `web`'s UI, see its README's `DEV_BYPASS_AUTH` note - no
`.env` is required at all for that.
