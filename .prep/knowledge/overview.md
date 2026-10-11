---
type: overview
title: fpa-profiles
description: Editor that enriches fpa-api's upstream players with profile data and exports it back to fpa-api
status: draft
generated:
  by: claude-code/opus-5.5
  at: 2026-10-11T09:13:19Z
---

fpa-profiles is the editor for player profile enrichment in the FPA (Freestyle Players Association) ecosystem. Players come from the upstream data that fpa-api aggregates and serves as a public REST API. This app lets an authenticated editor attach profile data (bio, nickname, career highlights, partners, mentors, links and similar) to those existing players; it never creates players. A one-off import seeds profiles from the legacy FPA WordPress site. fpa-api pulls the profiles through a read-only JSON export and serves them publicly, and fpa-events renders them on its player pages. Why it is built this way: [Separate editor app on Postgres](/decisions/separate-editor-app.md).

Stack: SvelteKit 3 with TypeScript, Drizzle ORM on Postgres (postgres.js), Better Auth (email and password, no email delivery), Tailwind 4, Vitest. Local Postgres runs from `compose.yaml` via `pnpm db:start`; production is a Coolify resource with its own Postgres.
