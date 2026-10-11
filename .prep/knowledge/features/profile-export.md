---
type: feature
title: Profile export for fpa-api
description: 'GET /export: the versioned, public JSON feed fpa-api pulls; the contract between the two repositories'
status: draft
generated:
  by: claude-code/opus-5.5
  at: 2026-10-11T09:33:03Z
scope:
  - src/lib/profile/export.ts
  - src/routes/export/+server.ts
confirmed_commit: 17dc1a8203582dd8b13ab4fb7a24c322b8156d60
---

`GET /export` (`src/routes/export/+server.ts`) is the only way profile data leaves this app. It needs no authentication because it contains only fields the [field registry](/components/profile-fields.md) marks `exported`, and it is sent with `cache-control: no-store`.

```json
{
  "version": 1,
  "generatedAt": "2026-10-11T12:00:00.000Z",
  "profiles": [
    { "playerId": "…", "updatedAt": "…", "fields": { "nickname": "Laerbs", "links": [{ "kind": "website", "url": "https://…", "label": "…" }] } }
  ]
}
```

`toExport` in `src/lib/profile/export.ts` builds it (pure, unit-tested): profiles sorted by `playerId`, empty values omitted, profiles with nothing public left out. `legacyId` and `updatedBy` are never exported.

## Contract with fpa-api

fpa-api pulls this feed as one of its sources and serves the fields on its player responses. It validates `fields` by value shape (string, string list, link list), not by key, so **a new registry field reaches the public API without an fpa-api release**. Whether a field is public is decided only by its `exported` flag. `version` changes only for breaking changes to the envelope, which need a coordinated fpa-api change.

`playerId` is canonical when written; fpa-api resolves it through its alias map, so an upstream merge does not orphan a profile.

After a save, `requestRefresh` (`src/lib/server/fpa-api.ts`) asks fpa-api to `POST /refresh` when `FPA_API_REFRESH_TOKEN` is set, so the change is public immediately; it is best effort and never fails the save.
