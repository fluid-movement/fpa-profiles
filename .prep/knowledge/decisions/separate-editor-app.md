---
type: decision
title: Separate editor app on Postgres
description: Why profiles are edited in their own SvelteKit app with its own Postgres, and why fpa-api pulls a JSON export instead of sharing a database
status: draft
generated:
  by: claude-code/opus-5.5
  at: 2026-10-11T09:13:19Z
scope:
  - package.json
  - drizzle.config.ts
  - compose.yaml
confirmed_commit: 3509929d3f9f2b24b113b87b0b5e98dc273a7eba
---

## Decision

Profile enrichment is edited in this separate SvelteKit application, which owns its data in its own Postgres database. fpa-api reads the profiles only through a read-only JSON export that it pulls like its other upstream sources. Decided on 2026-10-11 (fpa-api issue 01M4N2FFHKBV8MB99QJ3NQJ5EZ).

## Why

- fpa-api is read-only and database-free by design: it rebuilds an in-memory index from upstream on a refresh schedule. Putting a write path, sessions and a database into it would break that design. Pulling an export keeps fpa-api unchanged in kind: one more source, persisted in its snapshot, degraded and flagged when unavailable.
- An admin area inside fpa-events was rejected: fpa-api would then pull from fpa-events, which itself consumes fpa-api, and data curation would be coupled to the public events site.
- Postgres matches fpa-events (Drizzle and Better Auth on Postgres). It runs as its own Coolify resource, so it can be restored and upgraded independently. Hetzner whole-disk backups are crash-consistent, which Postgres recovers from.
- A separate repository, because Coolify deploys one resource per repository and the apps share nothing but the export format.

## Consequences

- The JSON export is the contract between this app and fpa-api; changing it is a cross-repository change.
- Profiles are keyed by upstream player ids that this app does not own. fpa-api resolves them through its alias map, so upstream player merges do not orphan a profile.
- Users are managed from the terminal (over SSH in production); the app sends no email.
