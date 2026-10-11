---
title: The player list shows profile changes without a reload
kind: code
parent: 01M4N3HPHYB8PHJF2CSWT6A1HD
tags:
  - profiles
---

After saving a profile and going back to the player list, the list still shows the state from before the save: a new profile has no badge, a removed one keeps it, and the "with profile" filter is stale. Only a hard reload fixes it.

The cause: the list reads `findPlayers({ q, withProfile })` (`src/routes/+page.svelte`), a remote query that SvelteKit caches in the browser, and `saveProfile` (`src/routes/players/[playerId]/data.remote.ts`) refreshes only `getEditor`. The list must show the current profile state whenever it is opened after a save, without hitting fpa-api more than it does now (the directory stays cached on the server; only the profile ids are re-read).

## Open questions
