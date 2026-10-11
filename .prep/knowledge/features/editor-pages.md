---
type: feature
title: Player search and profile editor pages
description: How the player list filters (URL state, cached fpa-api directory, profile toggle) and how the profile form works (per-player form instance, link rows with add and delete)
status: draft
generated:
  by: claude-code/opus-5.5
  at: 2026-10-11T12:15:56Z
scope:
  - src/routes/+page.svelte
  - src/routes/data.remote.ts
  - src/routes/players/**
  - src/lib/server/fpa-api.ts
confirmed_commit: 9f6293aa5755d50e123cfe64075775bcf7322380
---

## Player list (`/`)

- **Filters live in the URL**: `?q=` (name) and `?profiles=1` (only players with a profile). Typing updates `q` after a 200 ms pause with `goto(…, { replace: true, reset: false })`, so there is no search button, focus stays in the input, and the list gets one history entry per visit. Going back from a profile therefore restores the filtered list. The input keeps its own `$state` text so a URL round trip never interrupts typing.
- **Data**: `findPlayers({ q, withProfile })` (`src/routes/data.remote.ts`) filters **in memory**: `allPlayers()` in `src/lib/server/fpa-api.ts` caches fpa-api's whole player directory (about 2,600 players, paged at 500) for five minutes, so filtering never calls fpa-api per keystroke. Whether a player has a profile comes from this app's `profile` table (`profiledPlayerIds()`), not from fpa-api's copy. Results are sorted by name and capped at 100, with the total shown.
- The toggle is a shadcn `Switch` ([SvelteKit conventions](/conventions/sveltekit.md)).

## Profile form (`/players/[playerId]`)

- `getEditor(playerId)` loads the player from fpa-api (any id resolves to the canonical one) and the stored profile; the form is generated from the [field registry](/components/profile-fields.md).
- **One form instance per player**: `saveProfile.for(editor.player.id)`. A shared instance carried the previous player's submitted values and "Saved." onto the next player's page.
- **Links**: only saved links render. "Add link" appends a row; a lucide `Trash2` button removes one. Each row keeps the form index it was created with (`links[i]`) and indexes are never reused, so deleting a row leaves an empty slot in the submission instead of shifting other rows' values. The form schema accepts empty slots and `normalizeFields` drops them, together with any row left blank, so empty links are never stored. Rows reset when the player changes, because the page component is reused across players.
- Saving re-validates with `normalizeFields`, stores the profile under the canonical id with the editor's username, refreshes `getEditor`, and asks fpa-api to refresh ([export](/features/profile-export.md)).
