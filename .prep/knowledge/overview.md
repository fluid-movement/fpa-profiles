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

Stack: SvelteKit 3 with TypeScript, Drizzle ORM on Postgres (postgres.js), Better Auth (username and password, no email), Tailwind 4, Vitest, valibot. Local Postgres runs from `compose.yaml` via `pnpm db:start` (or any local server); production is a Coolify resource with its own Postgres.

## Map

- [Profile field registry and storage](/components/profile-fields.md): where fields are defined and how they are validated and stored
- [Player search and profile editor pages](/features/editor-pages.md): list filters, the profile form, link rows
- [Profile export for fpa-api](/features/profile-export.md): the public feed and its contract
- [Editor sign-in and accounts](/features/editor-accounts.md): Better Auth, the route guard, the users script
- [Legacy profile import](/features/legacy-import.md): seeding profiles from the old WordPress site
- [Build and deployment](/components/deployment.md): Dockerfile, migrations, environment
- [SvelteKit conventions](/conventions/sveltekit.md): remote functions, form fields, runes
