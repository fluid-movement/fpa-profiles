---
title: Keep a local copy of the player directory, refreshed on demand
kind: code
parent: 01M4N3HPHYB8PHJF2CSWT6A1HD
tags:
  - profiles
---

The editor reads players from fpa-api on almost every action: `allPlayers()` reloads the whole directory (about 2,600 players, 6 pages) whenever its five-minute in-memory cache expires, and `getPlayer()` calls fpa-api uncached each time an editor page opens and again on every save. Player ids change very rarely, so these reads are mostly redundant. They slow the app down, and they make search and editing fail whenever fpa-api is unreachable.

Keep a copy of the player directory in this app's Postgres and serve search, the editor page and save validation from it. fpa-api is read only when the copy is refreshed. An editor can start a refresh with a button. A refresh must never damage the copy: a failed, empty or suspiciously short response keeps the existing data, and profile rows are never touched by a refresh.

Out of scope: changes to fpa-api, and the export format.

## Open questions

- What does the copy hold? Search and display need `fullName` and `country` as well as the id, and resolving an old id to its canonical one needs `aliasIds`. Is that the full set?
- Is the button the only trigger, or should the app also refresh on a schedule (for example daily) and on startup when the copy is empty? Without a schedule, a player new to fpa-api stays invisible until someone thinks to press the button.
- When a player is gone from fpa-api after a refresh, is their row deleted, or kept and marked missing? What does the editor show for a profile whose player is missing?
- What counts as a suspicious refresh to reject: an empty list, fewer players than some share of the current count, or something else?
- Should saving still re-check the player against fpa-api, or trust the local copy?
