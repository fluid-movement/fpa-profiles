# features

## Entries

* [Editor sign-in and accounts](/features/editor-accounts.md) - Username-and-password sign-in through Better Auth's username plugin (no email; a placeholder fills Better Auth's required email column), the route guard, and the users script
* [Legacy profile import](/features/legacy-import.md) - One-off import of player profiles from the old FPA WordPress dump: matching through fpa-api, field mapping, HTML conversion, and running it safely (dry run, no overwrites)
* [Profile export for fpa-api](/features/profile-export.md) - GET /export: the versioned, public JSON feed fpa-api pulls; the contract between the two repositories
