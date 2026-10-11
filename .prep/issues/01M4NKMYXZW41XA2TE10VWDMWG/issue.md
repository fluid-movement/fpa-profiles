---
title: Saving an empty profile removes it
kind: code
parent: 01M4N3HPHYB8PHJF2CSWT6A1HD
tags:
  - profiles
priority: high
---

When an editor clears every field of a profile and saves, the `profile` row stays with empty `fields`. The player keeps the profile badge in the list and still counts under the "with profile" filter, although the profile holds nothing. The export already skips profiles with no exported fields (`toExport` in `src/lib/profile/export.ts`), so fpa-api is unaffected; only this app is wrong.

Saving a profile whose normalized fields are empty deletes the row instead of upserting it (`saveProfile` in `src/lib/server/profiles.ts`). The editor page then shows the player as having no profile, the same as before one was ever created. Saving an empty form for a player without a profile writes nothing.

Deleting also drops the row's `legacy_id`. That is fine: the legacy import has run in production and will never run again.

## Open questions
