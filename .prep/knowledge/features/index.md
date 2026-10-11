# features

## Entries

* [Editor sign-in and accounts](/features/editor-accounts.md) - Username-and-password sign-in through Better Auth's username plugin (no email; a placeholder fills Better Auth's required email column), the route guard, and the users script
* [Player search and profile editor pages](/features/editor-pages.md) - How the player list filters (URL state, cached fpa-api directory, profile toggle) and how the profile form works (per-player form instance, link rows with add and delete)
* [Legacy profile import](/features/legacy-import.md) - History of the one-off import of profiles from the old FPA WordPress site (run 2026-10-11, code removed): what it mapped, and what it left in the data (legacy_id, updated_by = import)
* [Profile export for fpa-api](/features/profile-export.md) - GET /export: the versioned, public JSON feed fpa-api pulls; the contract between the two repositories
