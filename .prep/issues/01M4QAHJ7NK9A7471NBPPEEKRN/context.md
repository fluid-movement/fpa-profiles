Touches the player list, see [Player search and profile editor pages](/features/editor-pages.md#player-list).

- `src/routes/+page.svelte`: URL is the filter state (`?q=`, `?profiles=1`). Add `?page=` and `?size=` the same way, so going back from a profile restores the page. `applyFilters` resets `page` when `q` or the profile toggle changes; changing the size also resets it.
- `src/routes/data.remote.ts` `findPlayers`: filters in memory and currently caps at 100 (`LIMIT`). Replace the cap with `page` and `size` inputs (size one of 20/50/100) and slice server side; `total` stays the full match count. Clamp an out-of-range page to the last page.
- Components: add shadcn-svelte `pagination` and `radio-group` under `src/lib/components/ui` (`pnpm dlx shadcn-svelte@latest add pagination radio-group`).
- Layout: pagination between the search row and the list, with the size radio next to it. Hide the pagination when there is only one page.
- Knowledge: update `/features/editor-pages.md` (the 100 cap and URL params no longer hold).
